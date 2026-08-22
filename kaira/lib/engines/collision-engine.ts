import type {
  PurchaseSimulation,
  RiskLevel,
  UpcomingCharge,
} from "@/lib/types/finance";

interface SimulatePurchaseOptions {
  currentBalance: number;

  purchaseAmount: number;

  upcomingCharges: UpcomingCharge[];

  safetyBuffer?: number;
}

export function simulatePurchase({
  currentBalance,
  purchaseAmount,
  upcomingCharges,
  safetyBuffer = 1000,
}: SimulatePurchaseOptions): PurchaseSimulation {
  const upcomingExpenses =
    upcomingCharges.reduce(
      (total, charge) =>
        total + charge.amount,
      0,
    );

  const safeToSpendBefore =
    currentBalance -
    upcomingExpenses -
    safetyBuffer;

  const balanceAfterPurchase =
    currentBalance - purchaseAmount;

  const safeToSpendAfter =
    balanceAfterPurchase -
    upcomingExpenses -
    safetyBuffer;

  let riskLevel: RiskLevel = "safe";

  if (safeToSpendAfter < 0) {
    riskLevel = "danger";
  } else if (
    safeToSpendAfter <
    safetyBuffer * 0.5
  ) {
    riskLevel = "warning";
  }

  const deficit =
    safeToSpendAfter < 0
      ? Math.abs(safeToSpendAfter)
      : 0;

  let message = "";

  if (riskLevel === "safe") {
    message =
      `This purchase looks safe. ` +
      `After covering your upcoming commitments, ` +
      `you would still have $${Math.round(
        safeToSpendAfter,
      ).toLocaleString()} available.`;
  }

  if (riskLevel === "warning") {
    message =
      `You can afford this purchase, but it would significantly ` +
      `reduce your financial margin. ` +
      `You would have approximately $${Math.round(
        safeToSpendAfter,
      ).toLocaleString()} available.`;
  }

  if (riskLevel === "danger") {
    message =
      `This purchase would collide with your upcoming commitments. ` +
      `You would be approximately $${Math.round(
        deficit,
      ).toLocaleString()} below your safe financial margin.`;
  }

  return {
    purchaseAmount,

    balanceAfterPurchase:
      Math.round(balanceAfterPurchase * 100) /
      100,

    safeToSpendBefore:
      Math.round(safeToSpendBefore * 100) /
      100,

    safeToSpendAfter:
      Math.round(safeToSpendAfter * 100) /
      100,

    upcomingExpenses:
      Math.round(upcomingExpenses * 100) /
      100,

    safetyBuffer,

    riskLevel,

    deficit:
      Math.round(deficit * 100) / 100,

    message,
  };
}