"use client";

import {
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  CheckCircle2,
  DatabaseZap,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

type ProfileType =
  | "own-income"
  | "dependent"
  | "minor";

interface VerificationResult {
  profileType:
    ProfileType;

  verified:
    boolean;

  transactionId:
    string;

  blockHeight:
    number;
}

export default function PrivateFinancialIdentity() {
  const [
    profileType,
    setProfileType,
  ] =
    useState<ProfileType>(
      "own-income",
    );

  const [
    age,
    setAge,
  ] =
    useState(
      27,
    );

  const [
    minimumRequiredIncome,
    setMinimumRequiredIncome,
  ] =
    useState(
      20000,
    );

  const [
    monthlyIncome,
    setMonthlyIncome,
  ] =
    useState(
      32500,
    );

  const [
    supporterMonthlyIncome,
    setSupporterMonthlyIncome,
  ] =
    useState(
      45000,
    );

  const [
    guardianMonthlyIncome,
    setGuardianMonthlyIncome,
  ] =
    useState(
      45000,
    );

  const [
    status,
    setStatus,
  ] = useState<
    | "idle"
    | "loading"
    | "success"
    | "error"
  >("idle");

  const [
    result,
    setResult,
  ] =
    useState<VerificationResult | null>(
      null,
    );

  function resetResult() {
    setResult(
      null,
    );

    setStatus(
      "idle",
    );
  }

  function selectProfile(
    profile:
      ProfileType,
  ) {
    setProfileType(
      profile,
    );

    resetResult();

    if (
      profile ===
      "minor"
    ) {
      setAge(
        16,
      );
    } else if (
      profile ===
      "dependent"
    ) {
      setAge(
        22,
      );
    } else {
      setAge(
        27,
      );
    }
  }

  async function verifyIdentity() {
    try {
      setStatus(
        "loading",
      );

      setResult(
        null,
      );

      /*
       * Notice what is NOT here:
       *
       * taxCompliant
       * guardianVerified
       * relationshipVerified
       *
       * Those trusted claims come
       * from the server.
       */
      let body:
        Record<
          string,
          unknown
        > = {
        profileType,
        age,
        minimumRequiredIncome,
      };

      if (
        profileType ===
        "own-income"
      ) {
        body = {
          ...body,

          monthlyIncome,
        };
      }

      if (
        profileType ===
        "dependent"
      ) {
        body = {
          ...body,

          supporterMonthlyIncome,
        };
      }

      if (
        profileType ===
        "minor"
      ) {
        body = {
          ...body,

          guardianMonthlyIncome,
        };
      }

      const response =
        await fetch(
          "/api/private-identity",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body,
              ),
          },
        );

      const data =
        await response
          .json()
          .catch(
            () =>
              null,
          );

      if (
        !response.ok ||
        !data?.verification
      ) {
        throw new Error(
          data?.message ??
            "Unable to verify identity.",
        );
      }

      setResult(
        data.verification,
      );

      setStatus(
        "success",
      );
    } catch (error) {
      console.error(
        "Private identity UI error:",
        error,
      );

      setStatus(
        "error",
      );
    }
  }

  return (
    <div className="space-y-5">

      {/* PROFILE TYPE */}
      <section className="space-y-3 rounded-[1.75rem] border border-border/70 bg-card p-4">

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kaira-orange">
            Financial profile
          </p>

          <h2 className="mt-1 text-lg font-bold">
            How are your finances supported?
          </h2>
        </div>

        <ProfileButton
          active={
            profileType ===
            "own-income"
          }
          icon={
            <UserRound className="h-4 w-4" />
          }
          title="I earn my own income"
          description="Salary, freelance income or another verified source."
          onClick={() =>
            selectProfile(
              "own-income",
            )
          }
        />

        <ProfileButton
          active={
            profileType ===
            "dependent"
          }
          icon={
            <UsersRound className="h-4 w-4" />
          }
          title="I depend on another person"
          description="A parent, partner or supporter covers your financial needs."
          onClick={() =>
            selectProfile(
              "dependent",
            )
          }
        />

        <ProfileButton
          active={
            profileType ===
            "minor"
          }
          icon={
            <ShieldCheck className="h-4 w-4" />
          }
          title="I am under legal age"
          description="A verified guardian is responsible for your financial support."
          onClick={() =>
            selectProfile(
              "minor",
            )
          }
        />

      </section>

      {/* PRIVATE CLAIMS */}
      <section className="space-y-4 rounded-[1.75rem] border border-kaira-purple/25 bg-gradient-to-br from-card to-kaira-purple/10 p-4">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kaira-purple/25 text-lavender">
            <LockKeyhole className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-bold">
              Private inputs
            </p>

            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Used to generate the
              Midnight proof. These raw
              financial values are not
              persisted in your Kaira
              profile or disclosed
              on-chain.
            </p>
          </div>

        </div>

        <NumberField
          label="Age"
          value={
            age
          }
          onChange={(
            value,
          ) => {
            setAge(
              value,
            );

            resetResult();
          }}
        />

        <MoneyField
          label="Minimum required monthly income"
          value={
            minimumRequiredIncome
          }
          onChange={(
            value,
          ) => {
            setMinimumRequiredIncome(
              value,
            );

            resetResult();
          }}
        />

        {profileType ===
          "own-income" && (
          <MoneyField
            label="Monthly income"
            value={
              monthlyIncome
            }
            onChange={(
              value,
            ) => {
              setMonthlyIncome(
                value,
              );

              resetResult();
            }}
          />
        )}

        {profileType ===
          "dependent" && (
          <MoneyField
            label="Supporter's monthly income"
            value={
              supporterMonthlyIncome
            }
            onChange={(
              value,
            ) => {
              setSupporterMonthlyIncome(
                value,
              );

              resetResult();
            }}
          />
        )}

        {profileType ===
          "minor" && (
          <MoneyField
            label="Guardian monthly income"
            value={
              guardianMonthlyIncome
            }
            onChange={(
              value,
            ) => {
              setGuardianMonthlyIncome(
                value,
              );

              resetResult();
            }}
          />
        )}

        {/* TRUSTED CREDENTIALS */}
        <div className="rounded-2xl border border-kaira-teal/20 bg-kaira-teal/5 p-4">

          <div className="flex items-start gap-3">

            <DatabaseZap className="mt-0.5 h-4 w-4 shrink-0 text-kaira-teal" />

            <div className="min-w-0">

              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-kaira-teal">
                Trusted credentials
              </p>

              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                These attestations are
                supplied by Kaira&apos;s
                trusted demo source.
                They cannot be changed
                from this browser.
              </p>

            </div>

          </div>

          <div className="mt-3 space-y-2">

            {profileType ===
              "own-income" && (
              <>
                <CredentialRow>
                  Income source credential
                </CredentialRow>

                <CredentialRow>
                  Compliance credential
                </CredentialRow>
              </>
            )}

            {profileType ===
              "dependent" && (
              <>
                <CredentialRow>
                  Supporter credential
                </CredentialRow>

                <CredentialRow>
                  Relationship credential
                </CredentialRow>

                <CredentialRow>
                  Supporter compliance credential
                </CredentialRow>
              </>
            )}

            {profileType ===
              "minor" && (
              <>
                <CredentialRow>
                  Guardian credential
                </CredentialRow>

                <CredentialRow>
                  Guardian relationship credential
                </CredentialRow>

                <CredentialRow>
                  Guardian compliance credential
                </CredentialRow>
              </>
            )}

          </div>

        </div>

        {/* VERIFY */}
        <button
          type="button"
          onClick={
            verifyIdentity
          }
          disabled={
            status ===
            "loading"
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-kaira-orange px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {status ===
          "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              Generating private proof...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />

              Verify without revealing
            </>
          )}
        </button>

      </section>

      {/* ERROR */}
      {status ===
        "error" && (
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-xs text-destructive">
          Kaira could not complete
          the private identity
          verification.
        </p>
      )}

      {/* RESULT */}
      {result && (
        <section
          className={`space-y-4 rounded-[1.75rem] border p-4 ${
            result.verified
              ? "border-kaira-teal/25 bg-kaira-teal/10"
              : "border-destructive/25 bg-destructive/10"
          }`}
        >

          <div className="flex items-start gap-3">

            <CheckCircle2
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                result.verified
                  ? "text-kaira-teal"
                  : "text-destructive"
              }`}
            />

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-kaira-teal">
                Midnight verification
              </p>

              <h3 className="mt-1 text-base font-bold">
                {result.verified
                  ? "Financial profile verified"
                  : "Financial profile requirement not satisfied"}
              </h3>

            </div>

          </div>

          {/* REVEALED */}
          <div className="rounded-xl border border-border/50 bg-background/40 p-3">

            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Revealed
            </p>

            <p className="mt-2 text-xs font-semibold">
              Verification result only
            </p>

          </div>

          {/* PRIVATE */}
          <div className="rounded-xl border border-kaira-purple/20 bg-kaira-purple/10 p-3">

            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-lavender">
              Kept private on-chain
            </p>

            <div className="mt-2 space-y-1 text-xs text-muted-foreground">

              <p>
                🔒 Exact income
              </p>

              <p>
                🔒 Exact age
              </p>

              <p>
                🔒 Identity documents
              </p>

              <p>
                🔒 Compliance details
              </p>

            </div>

          </div>

          {/* PROOF */}
          <div className="space-y-1 text-[10px] text-muted-foreground">

            <p>
              Block{" "}
              <span className="font-semibold text-foreground">
                {
                  result.blockHeight
                }
              </span>
            </p>

            <p className="truncate">
              Tx{" "}
              <span className="font-mono text-foreground">
                {
                  result.transactionId
                }
              </span>
            </p>

          </div>

          <Link
            href="/profile"
            className="flex w-full items-center justify-center rounded-2xl bg-kaira-orange px-4 py-3 text-sm font-bold text-white"
          >
            Back to profile
          </Link>

        </section>
      )}

    </div>
  );
}

function ProfileButton({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
        active
          ? "border-kaira-orange/40 bg-kaira-orange/10"
          : "border-border/60 bg-background/40"
      }`}
    >

      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
          active
            ? "bg-kaira-orange/15 text-kaira-orange"
            : "bg-background text-muted-foreground"
        }`}
      >
        {icon}
      </div>

      <div>

        <p className="text-xs font-bold">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
          {description}
        </p>

      </div>

    </button>
  );
}

function CredentialRow({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/35 px-3 py-2">

      <span className="text-[11px] text-muted-foreground">
        {children}
      </span>

      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-kaira-teal">
        <LockKeyhole className="h-3 w-3" />

        Server verified
      </span>

    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange:
    (value: number) =>
      void;
}) {
  return (
    <label className="block space-y-1.5">

      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>

      <input
        type="number"
        min="0"
        value={
          value
        }
        onChange={(
          event,
        ) =>
          onChange(
            Number(
              event.target
                .value,
            ),
          )
        }
        className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-kaira-orange/60"
      />

    </label>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange:
    (value: number) =>
      void;
}) {
  return (
    <label className="block space-y-1.5">

      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>

      <div className="flex items-center rounded-xl border border-border bg-background/60 px-3 py-2.5">

        <span className="mr-1 text-sm text-muted-foreground">
          MX$
        </span>

        <input
          type="number"
          min="0"
          value={
            value
          }
          onChange={(
            event,
          ) =>
            onChange(
              Number(
                event.target
                  .value,
              ),
            )
          }
          className="w-full bg-transparent text-sm font-semibold outline-none"
        />

      </div>

    </label>
  );
}