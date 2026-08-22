import {
  Eye,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import KairaShell from "@/components/kaira/KairaShell";
import RecurringControls from "@/components/kaira/RecurringControls";
import SectionTitle from "@/components/kaira/SectionTitle";

import {
  getAccount,
} from "@/lib/data/accounts";

import {
  getTransactions,
} from "@/lib/data/transactions";

import {
  detectRecurringPayments,
} from "@/lib/engines/recurring-engine";

import {
  forecastUpcomingCharges,
} from "@/lib/engines/forecast-engine";

import {
  calculateSafeToSpend,
} from "@/lib/engines/safe-to-spend-engine";

import {
  formatMoney,
} from "@/lib/utils/format-money";

import {
  supabaseServer,
} from "@/lib/supabase/server";

export default async function GuardPage() {
  const accountId =
    process.env.DEMO_ACCOUNT_ID;

  if (!accountId) {
    throw new Error(
      "DEMO_ACCOUNT_ID is missing.",
    );
  }

  const [
    account,
    transactions,
  ] = await Promise.all([
    getAccount(accountId),
    getTransactions(accountId),
  ]);

  const recurringPayments =
    detectRecurringPayments(
      transactions,
    );

  const upcomingCharges =
    forecastUpcomingCharges({
      recurringPayments,
      fromDate: "2026-08-22",
      days: 30,
    });

  const financialStatus =
    calculateSafeToSpend({
      currentBalance:
        account.balance,

      upcomingCharges,

      safetyBuffer:
        account.safetyBuffer,
    });

  const {
    data: guardEvents,
  } =
    await supabaseServer
      .from("guard_events")
      .select(`
        id,
        purchase_name,
        risk_level,
        recommendation,
        status
      `)
      .eq(
        "account_id",
        accountId,
      )
      .limit(3);

  return (
    <KairaShell>
      <div className="space-y-6">

        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Protection
          </p>

          <h1 className="mt-1 text-2xl font-bold">
            Kaira Guard
          </h1>

          <p className="mt-1 text-xs text-muted-foreground">
            Watching your commitments so nothing slips through.
          </p>
        </header>

        {/* PROTECTION SUMMARY */}
        <div className="glow-mint rounded-[1.75rem] border border-mint/30 bg-mint/10 p-5">

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-mint/30 bg-mint/15">
              <ShieldCheck className="h-6 w-6 text-mint" />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                You&apos;re protected
              </h2>

              <p className="text-xs text-muted-foreground">
                {recurringPayments.length} charges under watch
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">

            <Metric
              Icon={ShieldCheck}
              value={formatMoney(
                financialStatus.safeToSpend,
              )}
              label="Safe"
              color="text-mint"
            />

            <Metric
              Icon={Eye}
              value={String(
                recurringPayments.length,
              )}
              label="Watching"
              color="text-lavender"
            />

            <Metric
              Icon={ShieldAlert}
              value="0"
              label="At risk"
              color="text-warning"
            />

          </div>
        </div>

        <SectionTitle>
          Recurring controls
        </SectionTitle>

        <RecurringControls
          recurringPayments={
            recurringPayments
          }
        />

        <SectionTitle>
          Recent Guard actions
        </SectionTitle>

        <div className="space-y-2.5">
          {guardEvents &&
          guardEvents.length > 0 ? (
            guardEvents.map(
              (event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-border/70 bg-card p-4"
                >
                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint/10">
                      <ShieldCheck className="h-4 w-4 text-mint" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">
                        Protected{" "}
                        {
                          event.purchase_name
                        }
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {event.recommendation ??
                          `${event.risk_level} financial risk detected`}
                      </p>
                    </div>

                  </div>
                </div>
              ),
            )
          ) : (
            <p className="text-xs text-muted-foreground">
              No recent Guard actions yet.
            </p>
          )}
        </div>

      </div>
    </KairaShell>
  );
}

function Metric({
  Icon,
  value,
  label,
  color,
}: {
  Icon: typeof ShieldCheck;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/50 p-3">

      <Icon
        className={`h-4 w-4 ${color}`}
      />

      <p className="mt-2 text-sm font-bold">
        {value}
      </p>

      <p className="text-[10px] text-muted-foreground">
        {label}
      </p>

    </div>
  );
}