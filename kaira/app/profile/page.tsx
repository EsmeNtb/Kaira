import Link from "next/link";

import {
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import KairaShell from "@/components/kaira/KairaShell";

import {
  getAccount,
} from "@/lib/data/accounts";

import {
  supabaseServer,
} from "@/lib/supabase/server";

export const dynamic =
  "force-dynamic";

interface IdentityProof {
  profile_type:
    | "own-income"
    | "dependent"
    | "minor";

  midnight_verified:
    boolean;

  midnight_transaction_id:
    string | null;

  midnight_block_height:
    number | null;

  verified_at:
    string | null;
}

function profileLabel(
  profileType:
    IdentityProof["profile_type"],
) {
  if (
    profileType ===
    "own-income"
  ) {
    return "Own income";
  }

  if (
    profileType ===
    "dependent"
  ) {
    return "Financially dependent";
  }

  return "Minor with guardian";
}

export default async function ProfilePage() {
  const accountId =
    process.env
      .DEMO_ACCOUNT_ID;

  if (!accountId) {
    throw new Error(
      "DEMO_ACCOUNT_ID is missing.",
    );
  }

  const account =
    await getAccount(
      accountId,
    );

  const {
    data:
      identityData,
    error:
      identityError,
  } =
    await supabaseServer
      .from(
        "financial_identity_profiles",
      )
      .select(`
        profile_type,
        midnight_verified,
        midnight_transaction_id,
        midnight_block_height,
        verified_at
      `)
      .eq(
        "account_id",
        accountId,
      )
      .maybeSingle();

  if (
    identityError
  ) {
    console.error(
      "Unable to load private identity proof:",
      identityError,
    );
  }

  const identity =
    identityData as
      IdentityProof | null;

  return (
    <KairaShell>
      <div className="space-y-6">

        {/* PROFILE */}
        <header className="space-y-4">

          <div className="flex items-center gap-3">

            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-kaira-orange/20 bg-kaira-orange/10 text-kaira-orange">
              <CircleUserRound className="h-7 w-7" />
            </div>

            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Kaira profile
              </p>

              <h1 className="text-2xl font-bold">
                {account.ownerName}
              </h1>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {account.name}
              </p>
            </div>

          </div>

        </header>

        {/* ACCOUNT */}
        <section className="rounded-[1.75rem] border border-border/70 bg-card p-4">

          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kaira-orange">
            Account
          </p>

          <div className="mt-4 space-y-3">

            <InfoRow
              label="Currency"
              value={
                account.currency
              }
            />

            <InfoRow
              label="Kaira Guard"
              value="Active"
            />

            <InfoRow
              label="Privacy mode"
              value="Midnight enabled"
            />

          </div>

        </section>

        {/* PRIVATE FINANCIAL IDENTITY */}
        <section className="overflow-hidden rounded-[1.75rem] border border-kaira-purple/30 bg-gradient-to-br from-card via-card to-kaira-purple/10">

          <div className="p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-kaira-purple/25 text-lavender">
                <LockKeyhole className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-lavender">
                  Private Financial Identity
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Verify without revealing
                </h2>

                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Prove financial eligibility
                  without storing or publishing
                  the underlying financial
                  values.
                </p>

              </div>

            </div>

            {!identity && (
              <div className="mt-5">

                <div className="rounded-2xl border border-border/60 bg-background/40 p-4">

                  <p className="text-sm font-semibold">
                    Financial identity not verified
                  </p>

                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Create a Midnight
                    zero-knowledge proof for
                    your financial profile.
                  </p>

                </div>

                <Link
                  href="/identity"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-kaira-orange px-4 py-3 text-sm font-bold text-white"
                >
                  <ShieldCheck className="h-4 w-4" />

                  Verify privately

                  <ChevronRight className="h-4 w-4" />
                </Link>

              </div>
            )}

            {identity && (
              <div className="mt-5 space-y-4">

                <div
                  className={`rounded-2xl border p-4 ${
                    identity.midnight_verified
                      ? "border-kaira-teal/25 bg-kaira-teal/10"
                      : "border-destructive/25 bg-destructive/10"
                  }`}
                >

                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      className={`h-5 w-5 ${
                        identity.midnight_verified
                          ? "text-kaira-teal"
                          : "text-destructive"
                      }`}
                    />

                    <div>

                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-kaira-teal">
                        Midnight verified
                      </p>

                      <p className="mt-0.5 text-sm font-bold">
                        {identity.midnight_verified
                          ? "Financial profile verified"
                          : "Financial requirement not satisfied"}
                      </p>

                    </div>

                  </div>

                  <div className="mt-4 space-y-2">

                    <InfoRow
                      label="Profile"
                      value={
                        profileLabel(
                          identity.profile_type,
                        )
                      }
                    />

                    {identity.midnight_block_height !==
                      null && (
                      <InfoRow
                        label="Block"
                        value={
                          String(
                            identity.midnight_block_height,
                          )
                        }
                      />
                    )}

                  </div>

                  {identity.midnight_transaction_id && (
                    <div className="mt-3">

                      <p className="text-[10px] text-muted-foreground">
                        Transaction
                      </p>

                      <p className="mt-1 truncate font-mono text-[10px]">
                        {
                          identity.midnight_transaction_id
                        }
                      </p>

                    </div>
                  )}

                </div>

                {/* PRIVACY */}
                <div className="rounded-2xl border border-border/60 bg-background/40 p-4">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Private by design
                  </p>

                  <div className="mt-3 space-y-2 text-xs text-muted-foreground">

                    <p>
                      🔒 Exact income not stored
                    </p>

                    <p>
                      🔒 Exact age not stored
                    </p>

                    <p>
                      🔒 Financial documents not stored
                    </p>

                    <p>
                      🔒 Compliance details not stored
                    </p>

                  </div>

                </div>

                <Link
                  href="/identity"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-kaira-orange/25 bg-kaira-orange/10 px-4 py-3 text-sm font-bold text-kaira-orange"
                >
                  Re-verify identity

                  <ChevronRight className="h-4 w-4" />
                </Link>

              </div>
            )}

          </div>

        </section>

        {/* PRIVACY SUMMARY */}
        <section className="rounded-[1.75rem] border border-kaira-teal/20 bg-kaira-teal/5 p-4">

          <div className="flex gap-3">

            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-kaira-teal" />

            <div>

              <p className="text-sm font-bold">
                Your proof, not your secrets
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Kaira retains the Midnight
                verification result and proof
                metadata. Sensitive financial
                inputs are not persisted in
                this profile.
              </p>

            </div>

          </div>

        </section>

      </div>
    </KairaShell>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-xs text-muted-foreground">
        {label}
      </span>

      <span className="text-right text-xs font-semibold">
        {value}
      </span>

    </div>
  );
}