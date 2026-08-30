import "server-only";

import {
  getAccount,
} from "@/lib/data/accounts";

import {
  getTransactions,
} from "@/lib/data/transactions";

import {
  getSavingsGoals,
} from "@/lib/data/savings-goals";

import {
  detectRecurringPayments,
} from "@/lib/engines/recurring-engine";

import {
  forecastUpcomingCharges,
} from "@/lib/engines/forecast-engine";

export interface PrivateGuardSnapshot {
  currentBalance: number;
  upcomingCommitments: number;
  reservedSavings: number;
  safetyBuffer: number;
  purchaseAmount: number;
}

export interface MidnightCircuitInput {
  currentBalance: bigint;
  upcomingCommitments: bigint;
  reservedSavings: bigint;
  safetyBuffer: bigint;
  purchaseAmount: bigint;
}

export interface MidnightVerificationResult {
  verified: boolean;
  transactionId: string;
  blockHeight: number;
}

// --------------------------------------------------
// BUILD KAIRA FINANCIAL SNAPSHOT
// --------------------------------------------------

export async function buildPrivateGuardSnapshot(
  accountId: string,
  purchaseAmount: number,
): Promise<PrivateGuardSnapshot> {
  if (
    !Number.isFinite(purchaseAmount) ||
    purchaseAmount < 0
  ) {
    throw new Error(
      "Invalid purchase amount.",
    );
  }

  const [
    account,
    transactions,
    savingsGoals,
  ] = await Promise.all([
    getAccount(accountId),
    getTransactions(accountId),
    getSavingsGoals(accountId),
  ]);

  const recurringPayments =
    detectRecurringPayments(
      transactions,
    );

  const fromDate =
    process.env.DEMO_REFERENCE_DATE ??
    new Date()
      .toISOString()
      .slice(0, 10);

  const upcomingCharges =
    forecastUpcomingCharges({
      recurringPayments,
      fromDate,
      days: 30,
    });

  const upcomingCommitments =
    upcomingCharges.reduce(
      (total, charge) =>
        total + charge.amount,
      0,
    );

  const reservedSavings =
    savingsGoals.reduce(
      (total, goal) =>
        total + goal.savedAmount,
      0,
    );

  return {
    currentBalance:
      account.balance,

    upcomingCommitments,

    reservedSavings,

    safetyBuffer:
      account.safetyBuffer,

    purchaseAmount,
  };
}

// --------------------------------------------------
// MONEY → MIDNIGHT UINT<64>
// --------------------------------------------------

const UINT64_MAX =
  BigInt("18446744073709551615");

function toMinorUnits(
  amount: number,
): bigint {
  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error(
      "Invalid monetary amount.",
    );
  }

  const minorUnits =
    Math.round(amount * 100);

  if (
    !Number.isSafeInteger(minorUnits)
  ) {
    throw new Error(
      "Monetary amount exceeds safe JavaScript precision.",
    );
  }

  const value =
    BigInt(minorUnits);

  if (value > UINT64_MAX) {
    throw new Error(
      "Monetary amount exceeds Midnight Uint<64>.",
    );
  }

  return value;
}

export function toMidnightCircuitInput(
  snapshot: PrivateGuardSnapshot,
): MidnightCircuitInput {
  return {
    currentBalance:
      toMinorUnits(
        snapshot.currentBalance,
      ),

    upcomingCommitments:
      toMinorUnits(
        snapshot.upcomingCommitments,
      ),

    reservedSavings:
      toMinorUnits(
        snapshot.reservedSavings,
      ),

    safetyBuffer:
      toMinorUnits(
        snapshot.safetyBuffer,
      ),

    purchaseAmount:
      toMinorUnits(
        snapshot.purchaseAmount,
      ),
  };
}

// --------------------------------------------------
// KAIRA → MIDNIGHT BRIDGE
// --------------------------------------------------

export async function verifyPurchaseWithMidnight(
  accountId: string,
  purchaseAmount: number,
): Promise<MidnightVerificationResult> {
  const snapshot =
    await buildPrivateGuardSnapshot(
      accountId,
      purchaseAmount,
    );

  const input =
    toMidnightCircuitInput(
      snapshot,
    );

  const bridgeUrl =
    process.env.MIDNIGHT_GUARD_URL ??
    "http://127.0.0.1:8787";

  const response =
    await fetch(
      `${bridgeUrl}/verify`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          currentBalance:
            input.currentBalance.toString(),

          upcomingCommitments:
            input.upcomingCommitments.toString(),

          reservedSavings:
            input.reservedSavings.toString(),

          safetyBuffer:
            input.safetyBuffer.toString(),

          purchaseAmount:
            input.purchaseAmount.toString(),
        }),
      },
    );

  if (!response.ok) {
    const message =
      await response.text();

    throw new Error(
      `Midnight verification failed: ${message}`,
    );
  }

  const result =
    await response.json() as
      MidnightVerificationResult;

  return result;
}