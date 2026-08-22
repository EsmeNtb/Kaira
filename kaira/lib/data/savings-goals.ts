import "server-only";

import {
  supabaseServer,
} from "@/lib/supabase/server";

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

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  icon: string;
}

export interface SavingsGoalSnapshot {
  goals: SavingsGoal[];
  currentBalance: number;
  totalSaved: number;
  availableToSave: number;
}

export async function getSavingsGoals(
  accountId: string,
): Promise<SavingsGoal[]> {
  const {
    data,
    error,
  } =
    await supabaseServer
      .from("savings_goals")
      .select(`
        id,
        name,
        target_amount,
        saved_amount,
        icon
      `)
      .eq(
        "account_id",
        accountId,
      )
      .order(
        "created_at",
        {
          ascending: true,
        },
      );

  if (error) {
    throw new Error(
      `Unable to load savings goals: ${error.message}`,
    );
  }

  return (
    data ?? []
  ).map(
    (goal) => ({
      id:
        goal.id,

      name:
        goal.name,

      targetAmount:
        Number(
          goal.target_amount,
        ),

      savedAmount:
        Number(
          goal.saved_amount,
        ),

      icon:
        goal.icon ??
        "target",
    }),
  );
}

export async function getSavingsGoalSnapshot(
  accountId: string,
): Promise<SavingsGoalSnapshot> {
  const [
    account,
    transactions,
    goals,
  ] = await Promise.all([
    getAccount(
      accountId,
    ),

    getTransactions(
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

  const totalSaved =
    goals.reduce(
      (
        total,
        goal,
      ) =>
        total +
        goal.savedAmount,
      0,
    );

  const planningBalance =
    account.balance -
    totalSaved;

  const financialStatus =
    calculateSafeToSpend({
      currentBalance:
        planningBalance,

      upcomingCharges,

      safetyBuffer:
        account.safetyBuffer,
    });

  return {
    goals,

    currentBalance:
      account.balance,

    totalSaved,

    availableToSave:
      Math.max(
        0,
        financialStatus.safeToSpend,
      ),
  };
}