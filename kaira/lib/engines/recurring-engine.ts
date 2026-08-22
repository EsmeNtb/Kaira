import { resolveMerchant } from "@/lib/engines/merchant-resolver";

import {
  addDays,
  differenceInCalendarDays,
  format,
} from "date-fns";

import type {
  RecurringFrequency,
  RecurringPayment,
  Transaction,
} from "@/lib/types/finance";

interface FrequencyCandidate {
  frequency: RecurringFrequency;
  expectedDays: number;
  toleranceDays: number;
}

const frequencyCandidates: FrequencyCandidate[] = [
  {
    frequency: "weekly",
    expectedDays: 7,
    toleranceDays: 2,
  },
  {
    frequency: "biweekly",
    expectedDays: 14,
    toleranceDays: 3,
  },
  {
    frequency: "monthly",
    expectedDays: 30,
    toleranceDays: 5,
  },
  {
    frequency: "yearly",
    expectedDays: 365,
    toleranceDays: 30,
  },
];

function average(
  numbers: number[],
): number {

  if (numbers.length === 0) {
    return 0;
  }

  return (
    numbers.reduce(
      (total, number) => total + number,
      0,
    ) / numbers.length
  );
}

function calculateAmountConsistency(
  amounts: number[],
): number {
  
  if (amounts.length <= 1) {
    return 1;
  }

  const avg = average(amounts);

  if (avg === 0) {
    return 0;
  }

  const averageDeviation = average(
    amounts.map((amount) =>
      Math.abs(amount - avg),
    ),
  );

  const variation =
    averageDeviation / avg;

  return Math.max(
    0,
    Math.min(1, 1 - variation),
  );
}

function calculateFrequencyScore(
  intervals: number[],
  candidate: FrequencyCandidate,
): number {
  if (intervals.length === 0) {
    return 0;
  }

  const scores = intervals.map(
    (interval) => {
      const deviation = Math.abs(
        interval - candidate.expectedDays,
      );

      if (
        deviation >
        candidate.toleranceDays * 2
      ) {
        return 0;
      }

      return Math.max(
        0,
        1 -
          deviation /
            (candidate.toleranceDays * 2),
      );
    },
  );

  return average(scores);
}

function findBestFrequency(
  intervals: number[],
): {
  frequency: RecurringFrequency;
  score: number;
  expectedDays: number;
} | null {
  let best:
    | {
        frequency: RecurringFrequency;
        score: number;
        expectedDays: number;
      }
    | null = null;

  for (const candidate of frequencyCandidates) {
    const score =
      calculateFrequencyScore(
        intervals,
        candidate,
      );

    if (!best || score > best.score) {
      best = {
        frequency:
          candidate.frequency,
        score,
        expectedDays:
          candidate.expectedDays,
      };
    }
  }

  if (!best || best.score < 0.65) {
    return null;
  }

  return best;
}

export function detectRecurringPayments(
  transactions: Transaction[],
): RecurringPayment[] {
  const expenses =
    transactions.filter(
      (transaction) =>
        transaction.type === "expense",
    );

  const grouped =
    new Map<string, Transaction[]>();

  for (const transaction of expenses) {
    const merchant =
      resolveMerchant(
        transaction.merchant,
      );

    const existing =
      grouped.get(merchant) ?? [];

    existing.push(transaction);

    grouped.set(
      merchant,
      existing,
    );
  }

  const recurringPayments:
    RecurringPayment[] = [];

  for (
    const [
      merchant,
      merchantTransactions,
    ] of grouped
  ) {
    if (
      merchantTransactions.length < 3
    ) {
      continue;
    }

    const sorted =
      [...merchantTransactions].sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime(),
      );

    const intervals: number[] = [];

    for (
      let index = 1;
      index < sorted.length;
      index++
    ) {
      const interval =
        differenceInCalendarDays(
          new Date(
            sorted[index].date,
          ),
          new Date(
            sorted[index - 1].date,
          ),
        );

      intervals.push(interval);
    }

    const bestFrequency =
      findBestFrequency(intervals);

    if (!bestFrequency) {
      continue;
    }

    const amounts =
      sorted.map(
        (transaction) =>
          transaction.amount,
      );

    const amountConsistency =
      calculateAmountConsistency(
        amounts,
      );

    const occurrenceScore =
      Math.min(
        sorted.length / 5,
        1,
      );

    const patternStrength =
      intervals.filter(
        (interval) => interval > 0,
      ).length /
      intervals.length;

    const confidence =
      bestFrequency.score * 0.55 +
      amountConsistency * 0.2 +
      occurrenceScore * 0.15 +
      patternStrength * 0.1;

    /*
     * Reject weak patterns.
     */
    if (confidence < 0.7) {
      continue;
    }

    const averageAmount =
      average(amounts);

    const averageIntervalDays =
      average(intervals);

    const lastTransaction =
      sorted[
        sorted.length - 1
      ];

    const nextExpectedDate =
      addDays(
        new Date(
          lastTransaction.date,
        ),
        Math.round(
          bestFrequency.expectedDays,
        ),
      );

    recurringPayments.push({
      merchant,

      averageAmount:
        Math.round(
          averageAmount * 100,
        ) / 100,

      frequency:
        bestFrequency.frequency,

      averageIntervalDays:
        Math.round(
          averageIntervalDays * 10,
        ) / 10,

      nextExpectedDate:
        format(
          nextExpectedDate,
          "yyyy-MM-dd",
        ),

      confidence:
        Math.round(
          confidence * 100,
        ) / 100,

      occurrences:
        sorted.length,
    });
  }

  return recurringPayments.sort(
    (a, b) =>
      b.confidence -
      a.confidence,
  );
}