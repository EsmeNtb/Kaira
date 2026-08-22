import KairaShell from "@/components/kaira/KairaShell";

import SavingGoals from "@/components/kaira/SavingGoals";

import {
  getSavingsGoals,
} from "@/lib/data/savings-goals";

export const dynamic =
  "force-dynamic";

export default async function GoalsPage() {
  const accountId =
    process.env
      .DEMO_ACCOUNT_ID;

  if (!accountId) {
    throw new Error(
      "DEMO_ACCOUNT_ID is missing.",
    );
  }

  const goals =
    await getSavingsGoals(
      accountId,
    );

  return (
    <KairaShell>
      <div className="space-y-6">

        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-peach">
            Saving for
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Goals
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Protect money for tomorrow,
            without losing flexibility today.
          </p>
        </header>

        <SavingGoals
          goals={
            goals
          }
          showHeader={
            false
          }
          variant="page"
        />

      </div>
    </KairaShell>
  );
}