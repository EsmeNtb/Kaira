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
   * Savings goals are money
   * that exists in the account,
   * but Kaira considers reserved.
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

        <StatsChip
          transactionsAnalyzed={
            transactions.length
          }
          commitmentsDetected={
            recurringPayments.length
          }
        />

        <UpcomingCommitments
          upcomingCharges={
            upcomingCharges
          }
          transactions={
            transactions
          }
        />

        <SectionTitle>
          Kaira&apos;s overview
        </SectionTitle>

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

        <RecurringControls
          recurringPayments={
            recurringPayments
          }
          initialControls={
            recurringControls
          }
        />

        <SavingGoals
          goals={
            savingsGoals
          }
          variant="home"
        />

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
                "#3b82f6",
            },
          ]}
        />

      </div>
    </KairaShell>
  );
}