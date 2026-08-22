import KairaShell from "@/components/kaira/KairaShell";

import SavingGoals from "@/components/kaira/SavingGoals";

export default function GoalsPage() {
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
            Turn today&apos;s financial margin into tomorrow&apos;s plans.
          </p>
        </header>

        <SavingGoals
          showHeader={false}
          variant="page"
        />

      </div>
    </KairaShell>
  );
}