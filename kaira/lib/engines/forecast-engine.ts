import {
  addDays,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
} from "date-fns";

import type {
  RecurringPayment,
  UpcomingCharge,
} from "@/lib/types/finance";

interface ForecastOptions {
  recurringPayments: RecurringPayment[];
  fromDate: string;
  days?: number;
}

export function forecastUpcomingCharges({
  recurringPayments,
  fromDate,
  days = 30,
}: ForecastOptions): UpcomingCharge[] {
  const start = parseISO(fromDate);
  const end = addDays(start, days);

  return recurringPayments
    .filter((payment) => {
      const expectedDate = parseISO(
        payment.nextExpectedDate
      );

      const afterStart =
        isAfter(expectedDate, start) ||
        isEqual(expectedDate, start);

      const beforeEnd =
        isBefore(expectedDate, end) ||
        isEqual(expectedDate, end);

      return afterStart && beforeEnd;
    })
    .map((payment) => ({
      merchant: payment.merchant,
      amount: payment.averageAmount,
      expectedDate: payment.nextExpectedDate,
      confidence: payment.confidence,
    }))
    .sort(
      (a, b) =>
        new Date(a.expectedDate).getTime() -
        new Date(b.expectedDate).getTime()
    );
}