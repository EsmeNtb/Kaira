import { mockTransactions } from "@/lib/data/mock-transactions";

import { detectRecurringPayments } from "@/lib/engines/recurring-engine";

import { forecastUpcomingCharges } from "@/lib/engines/forecast-engine";

import { calculateSafeToSpend } from "@/lib/engines/safe-to-spend-engine";

import { PurchaseSimulator } from "@/components/purchase-simulator";

export default function Home() {
  const recurringPayments =
    detectRecurringPayments(mockTransactions);

  const upcomingCharges =
    forecastUpcomingCharges({
      recurringPayments,
      fromDate: "2026-08-21",
      days: 30,
    });

  const financialStatus =
    calculateSafeToSpend({
      currentBalance: 8400,
      upcomingCharges,
      safetyBuffer: 1000,
    });

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-4xl space-y-8">

        <header>
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            Kaira
          </p>

          <h1 className="mt-3 text-4xl font-semibold">
            Know what your money can handle.
          </h1>

          <p className="mt-3 max-w-xl text-zinc-400">
            Kaira looks ahead at your upcoming commitments
            so you know what you can safely spend today.
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <p className="text-zinc-400">
            Safe to spend
          </p>

          <p className="mt-2 text-6xl font-semibold">
            ${financialStatus.safeToSpend.toLocaleString()}
          </p>

          <p className="mt-3 text-sm text-zinc-500">
            Available without compromising your next 30 days.
          </p>

          <div className="mt-8 flex flex-wrap gap-8 text-sm text-zinc-400">
            <div>
              <p>Current balance</p>

              <p className="mt-1 text-white">
                ${financialStatus.currentBalance.toLocaleString()}
              </p>
            </div>

            <div>
              <p>Upcoming commitments</p>

              <p className="mt-1 text-white">
                ${financialStatus.upcomingExpenses.toLocaleString()}
              </p>
            </div>

            <div>
              <p>Safety reserve</p>

              <p className="mt-1 text-white">
                ${financialStatus.safetyBuffer.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-zinc-500">
                NEXT 30 DAYS
              </p>

              <h2 className="mt-1 text-xl font-medium">
                Upcoming commitments
              </h2>
            </div>

            <p className="text-sm text-zinc-500">
              Predicted by Kaira
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingCharges.map((charge) => (
              <div
                key={`${charge.merchant}-${charge.expectedDate}`}
                className="flex justify-between rounded-2xl border border-zinc-800 p-5"
              >
                <div>
                  <p className="font-medium">
                    {charge.merchant}
                  </p>

                  <p className="text-sm text-zinc-500">
                    Expected {charge.expectedDate}
                  </p>
                </div>

                <div className="text-right">
                  <p>
                    ${charge.amount.toLocaleString()}
                  </p>

                  <p className="text-sm text-zinc-500">
                    {Math.round(
                      charge.confidence * 100,
                    )}
                    % confidence
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <PurchaseSimulator
          currentBalance={8400}
          upcomingCharges={upcomingCharges}
          safetyBuffer={1000}
        />

      </div>
    </main>
  );
}