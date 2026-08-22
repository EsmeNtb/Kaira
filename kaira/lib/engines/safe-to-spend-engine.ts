import type {
  SafeToSpendResult,
  UpcomingCharge,
} from "@/lib/types/finance";

interface CalculateSafeToSpendOptions {
  currentBalance: number;

  upcomingCharges: UpcomingCharge[];

  safetyBuffer?: number;
}

export function calculateSafeToSpend({
  currentBalance,
  upcomingCharges,
  safetyBuffer = 1000,
}: CalculateSafeToSpendOptions): SafeToSpendResult {
  const upcomingExpenses =
    upcomingCharges.reduce(
      (total, charge) =>
        total + charge.amount,
      0,
    );

  const rawSafeToSpend =
    currentBalance -
    upcomingExpenses -
    safetyBuffer;

  return {
    currentBalance,

    upcomingExpenses:
      Math.round(upcomingExpenses * 100) / 100,

    safetyBuffer,

    safeToSpend:
      Math.max(
        0,
        Math.round(rawSafeToSpend * 100) / 100,
      ),
  };
}