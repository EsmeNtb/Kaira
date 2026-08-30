import {
  Target,
} from "lucide-react";

import KairaShell from "@/components/kaira/KairaShell";

import SavingGoals from "@/components/kaira/SavingGoals";

import {
  getSavingsGoalSnapshot,
} from "@/lib/data/savings-goals";

import {
  formatMoney,
} from "@/lib/utils/format-money";

export const dynamic =
  "force-dynamic";

interface GoalsPageProps {
  searchParams: Promise<{
    name?: string;
    amount?: string;
    source?: string;
  }>;
}

export default async function GoalsPage({
  searchParams,
}: GoalsPageProps) {
  const accountId =
    process.env
      .DEMO_ACCOUNT_ID;

  if (!accountId) {
    throw new Error(
      "DEMO_ACCOUNT_ID is missing.",
    );
  }

  const params =
    await searchParams;

  const snapshot =
    await getSavingsGoalSnapshot(
      accountId,
    );

  const incomingName =
    params.name?.trim() ??
    "";

  const parsedAmount =
    Number(
      params.amount ??
        0,
    );

  const incomingAmount =
    Number.isFinite(
      parsedAmount,
    ) &&
    parsedAmount > 0
      ? parsedAmount
      : 0;

  const fromSimulator =
    params.source ===
      "simulator" &&
    Boolean(
      incomingName,
    ) &&
    incomingAmount > 0;

  return (
    <KairaShell>
      <div className="space-y-6">

        {/* HEADER */}
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kaira-orange">
            Saving for
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Goals
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Protect money for
            tomorrow, without losing
            flexibility today.
          </p>
        </header>

        {/* PURCHASE COMING FROM SIMULATOR */}
        {fromSimulator && (
          <section className="rounded-[1.75rem] border border-kaira-orange/25 bg-gradient-to-br from-kaira-orange/10 via-card to-kaira-purple/10 p-5">

            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-kaira-orange/15 text-kaira-orange">
                <Target className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-kaira-orange">
                  From purchase simulator
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Turn this purchase
                  into a goal
                </h2>

                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Instead of stretching
                  today&apos;s budget,
                  Kaira can help you
                  plan for it.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border/60 bg-background/45 p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Planned purchase
              </p>

              <div className="mt-2 flex items-end justify-between gap-4">
                <p className="truncate text-base font-bold">
                  {incomingName}
                </p>

                <p className="shrink-0 text-xl font-extrabold text-kaira-orange">
                  {formatMoney(
                    incomingAmount,
                  )}
                </p>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Nothing is reserved
              until you confirm the
              goal.
            </p>

          </section>
        )}

        {/* GOALS */}
        <SavingGoals
          goals={
            snapshot.goals
          }
          currentBalance={
            snapshot.currentBalance
          }
          availableToSave={
            snapshot.availableToSave
          }
          showHeader={
            false
          }
          variant="page"

          defaultGoalName={
            fromSimulator
              ? incomingName
              : undefined
          }

          defaultTargetAmount={
            fromSimulator
              ? incomingAmount
              : undefined
          }

          autoOpenCreate={
            fromSimulator
          }
        />

      </div>
    </KairaShell>
  );
}