import Link from "next/link";

import {
  Activity,
  Calculator,
  ShieldCheck,
  Target,
} from "lucide-react";

import {
  getAccount,
} from "@/lib/data/accounts";

import {
  getTransactions,
} from "@/lib/data/transactions";

import {
  getRecurringControls,
} from "@/lib/data/recurring-controls";

import {
  getSavingsGoals,
} from "@/lib/data/savings-goals";

import {
  detectRecurringPayments,
} from "@/lib/engines/recurring-engine";

import {
  forecastUpcomingCharges,
} from "@/lib/engines/forecast-engine";

import {
  calculateSafeToSpend,
} from "@/lib/engines/safe-to-spend-engine";

import HeroSection from "@/components/kaira/HeroSection";
import StatsChip from "@/components/kaira/StatsChip";
import UpcomingCommitments from "@/components/kaira/UpcomingCommitments";
import SectionTitle from "@/components/kaira/SectionTitle";
import RecurringControls from "@/components/kaira/RecurringControls";
import KairaShell from "@/components/kaira/KairaShell";
import SavingGoals from "@/components/kaira/SavingGoals";
import DemoWallets from "@/components/kaira/DemoWallets";

import {
  PurchaseSimulator,
} from "@/components/purchase-simulator";

export const dynamic =
  "force-dynamic";

export default async function Home() {
  const accountId =
    process.env
      .DEMO_ACCOUNT_ID;

  if (!accountId) {
    throw new Error(
      "DEMO_ACCOUNT_ID is missing.",
    );
  }

  const [
    account,
    transactions,
    recurringControls,
    savingsGoals,
  ] = await Promise.all([
    getAccount(
      accountId,
    ),

    getTransactions(
      accountId,
    ),

    getRecurringControls(
      accountId,
    ),

    getSavingsGoals(
      accountId,
    ),
  ]);

  const recurringPayments =
    detectRecurringPayments(
      transactions,
    );

  const upcomingCharges =
    forecastUpcomingCharges({
      recurringPayments,

      fromDate:
        "2026-08-22",

      days: 30,
    });

  /*
   * Savings goals are money that
   * exists in the account but Kaira
   * considers reserved.
   */
  const reservedSavings =
    savingsGoals.reduce(
      (
        total,
        goal,
      ) =>
        total +
        goal.savedAmount,
      0,
    );

  /*
   * This is the amount Kaira
   * may actually plan around.
   */
  const planningBalance =
    account.balance -
    reservedSavings;

  const financialStatus =
    calculateSafeToSpend({
      currentBalance:
        planningBalance,

      upcomingCharges,

      safetyBuffer:
        account.safetyBuffer,
    });

  return (
    <KairaShell>
      <div className="space-y-7">

        {/* HERO */}
        <HeroSection
          name={
            account.ownerName
          }
          currentBalance={
            account.balance
          }
          safeToSpend={
            financialStatus.safeToSpend
          }
          upcomingCommitments={
            financialStatus.upcomingExpenses
          }
          safetyReserve={
            account.safetyBuffer
          }
        />

        {/* STATS */}
        <StatsChip
          transactionsAnalyzed={
            transactions.length
          }
          commitmentsDetected={
            recurringPayments.length
          }
        />

        {/* QUICK ACTIONS */}
        <section className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kaira-orange">
              Quick actions
            </p>

            <h2 className="mt-1 text-xl font-bold">
              What do you want to do?
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">

            {/* SIMULATE */}
            <Link
              href="#purchase-simulator"
              className="group rounded-2xl border border-kaira-orange/20 bg-kaira-orange/10 p-4 transition hover:border-kaira-orange/40 hover:bg-kaira-orange/15"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kaira-orange/15 text-kaira-orange">
                <Calculator className="h-5 w-5" />
              </div>

              <p className="mt-3 text-sm font-bold">
                Simulate purchase
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Check a purchase before
                committing your money.
              </p>
            </Link>

            {/* ADD GOAL */}
            <Link
              href="/goals"
              className="group rounded-2xl border border-kaira-teal/20 bg-kaira-teal/10 p-4 transition hover:border-kaira-teal/40 hover:bg-kaira-teal/15"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kaira-teal/15 text-kaira-teal">
                <Target className="h-5 w-5" />
              </div>

              <p className="mt-3 text-sm font-bold">
                Add a goal
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Turn something you want
                into a savings plan.
              </p>
            </Link>

            {/* GUARD */}
            <Link
              href="/guard"
              className="group rounded-2xl border border-kaira-purple/30 bg-kaira-purple/15 p-4 transition hover:border-kaira-purple/50 hover:bg-kaira-purple/20"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kaira-purple/25 text-lavender">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <p className="mt-3 text-sm font-bold">
                Kaira Guard
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Review private financial
                protection activity.
              </p>
            </Link>

            {/* ACTIVITY */}
            <Link
              href="/activity"
              className="group rounded-2xl border border-border/70 bg-card p-4 transition hover:border-kaira-silver/25"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/70 text-kaira-silver">
                <Activity className="h-5 w-5" />
              </div>

              <p className="mt-3 text-sm font-bold">
                Activity
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                See transactions and
                detected money patterns.
              </p>
            </Link>

          </div>
        </section>

        {/* UPCOMING */}
        <UpcomingCommitments
          upcomingCharges={
            upcomingCharges
          }
          transactions={
            transactions
          }
        />

        {/* PURCHASE SIMULATOR */}
        <div
          id="purchase-simulator"
          className="scroll-mt-8"
        >
          <SectionTitle>
            Plan before you spend
          </SectionTitle>

          <div className="mt-3">
            <PurchaseSimulator
              currentBalance={
                planningBalance
              }
              upcomingCharges={
                upcomingCharges
              }
              safetyBuffer={
                account.safetyBuffer
              }
            />
          </div>
        </div>

        {/* SAVING GOALS */}
        <SavingGoals
          goals={
            savingsGoals
          }
          currentBalance={
            account.balance
          }
          availableToSave={
            Math.max(
              0,
              financialStatus.safeToSpend,
            )
          }
          variant="home"
        />

        {/* RECURRING CONTROLS */}
        <RecurringControls
          recurringPayments={
            recurringPayments
          }
          initialControls={
            recurringControls
          }
        />

        {/* WALLETS */}
        <DemoWallets
          wallets={[
            {
              name:
                account.name ??
                "Main account",

              type:
                "Checking",

              balance:
                account.balance,

              tint:
                "#E2723A",
            },
          ]}
        />

      </div>
    </KairaShell>
  );
}