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

function normalizeMerchant(merchant: string): string {
  const normalized = merchant
    .toUpperCase()
    .replace(".COM", "")
    .replace(" MEXICO", "")
    .replace(" MX", "")
    .replace(/[^A-Z0-9 ]/g, "")
    .trim();

  return normalized;
}

function average(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }

  return numbers.reduce((sum, number) => sum + number, 0) /
    numbers.length;
}

function calculateConsistency(values: number[]): number {
  if (values.length <= 1) {
    return 1;
  }

  const avg = average(values);

  if (avg === 0) {
    return 0;
  }

  const averageDeviation = average(
    values.map((value) => Math.abs(value - avg)),
  );

  return Math.max(0, 1 - averageDeviation / avg);
}

function detectFrequency(
  intervalDays: number,
): RecurringFrequency | null {
  if (intervalDays >= 5 && intervalDays <= 9) {
    return "weekly";
  }

  if (intervalDays >= 12 && intervalDays <= 16) {
    return "biweekly";
  }

  if (intervalDays >= 25 && intervalDays <= 35) {
    return "monthly";
  }

  if (intervalDays >= 330 && intervalDays <= 400) {
    return "yearly";
  }

  return null;
}

export function detectRecurringPayments(
  transactions: Transaction[],
): RecurringPayment[] {
  const expenses = transactions.filter(
    (transaction) => transaction.type === "expense",
  );

  const grouped = new Map<string, Transaction[]>();

  for (const transaction of expenses) {
    const merchant = normalizeMerchant(transaction.merchant);

    const existingTransactions = grouped.get(merchant) ?? [];

    existingTransactions.push(transaction);

    grouped.set(merchant, existingTransactions);
  }

  const detected: RecurringPayment[] = [];

  for (const [merchant, merchantTransactions] of grouped) {
    if (merchantTransactions.length < 3) {
      continue;
    }

    const sorted = [...merchantTransactions].sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime(),
    );

    const intervals: number[] = [];

    for (let index = 1; index < sorted.length; index++) {
      intervals.push(
        differenceInCalendarDays(
          new Date(sorted[index].date),
          new Date(sorted[index - 1].date),
        ),
      );
    }

    const averageIntervalDays = average(intervals);

    const frequency = detectFrequency(averageIntervalDays);

    if (!frequency) {
      continue;
    }

    const amounts = sorted.map(
      (transaction) => transaction.amount,
    );

    const averageAmount = average(amounts);

    const intervalConsistency =
      calculateConsistency(intervals);

    const amountConsistency =
      calculateConsistency(amounts);

    const occurrenceScore = Math.min(
      sorted.length / 4,
      1,
    );

    const confidence =
      intervalConsistency * 0.45 +
      amountConsistency * 0.35 +
      occurrenceScore * 0.2;

    const lastTransaction =
      sorted[sorted.length - 1];

    const nextDate = addDays(
      new Date(lastTransaction.date),
      Math.round(averageIntervalDays),
    );

    detected.push({
      merchant,
      averageAmount:
        Math.round(averageAmount * 100) / 100,

      frequency,

      averageIntervalDays:
        Math.round(averageIntervalDays * 10) / 10,

      nextExpectedDate: format(
        nextDate,
        "yyyy-MM-dd",
      ),

      confidence:
        Math.round(confidence * 100) / 100,

      occurrences: sorted.length,
    });
  }

  return detected.sort(
    (a, b) => b.confidence - a.confidence,
  );
}