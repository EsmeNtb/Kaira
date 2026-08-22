"use client";

import { useMemo, useState } from "react";

import { simulatePurchase } from "@/lib/engines/collision-engine";

import type { UpcomingCharge } from "@/lib/types/finance";

interface PurchaseSimulatorProps {
  currentBalance: number;
  upcomingCharges: UpcomingCharge[];
  safetyBuffer: number;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PurchaseSimulator({
  currentBalance,
  upcomingCharges,
  safetyBuffer,
}: PurchaseSimulatorProps) {
  const [purchaseName, setPurchaseName] =
    useState("Headphones");

  const [purchaseAmount, setPurchaseAmount] =
    useState(3500);

  const [guardStatus, setGuardStatus] =
    useState<
      "idle" | "loading" | "protected" | "error"
    >("idle");

  const simulation = useMemo(() => {
    return simulatePurchase({
      currentBalance,
      purchaseAmount,
      upcomingCharges,
      safetyBuffer,
    });
  }, [
    currentBalance,
    purchaseAmount,
    upcomingCharges,
    safetyBuffer,
  ]);

  const riskConfig = {
    safe: {
      label: "Looks safe",
      icon: "🟢",
      className:
        "border-emerald-500/20 bg-emerald-500/10",
    },

    warning: {
      label: "Proceed carefully",
      icon: "🟡",
      className:
        "border-amber-500/20 bg-amber-500/10",
    },

    danger: {
      label: "High risk",
      icon: "🔴",
      className:
        "border-red-500/20 bg-red-500/10",
    },
  };

  const risk =
    riskConfig[simulation.riskLevel];

  function changePurchaseAmount(
    amount: number,
  ) {
    setPurchaseAmount(amount);
    setGuardStatus("idle");
  }

  async function activateKairaGuard() {
    try {
      setGuardStatus("loading");

      const response = await fetch(
        "/api/guard",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            purchaseName,

            purchaseAmount,

            riskLevel:
              simulation.riskLevel,

            safeToSpendAfter:
              simulation.safeToSpendAfter,

            upcomingExpenses:
              simulation.upcomingExpenses,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Unable to activate Kaira Guard.",
        );
      }

      setGuardStatus("protected");
    } catch (error) {
      console.error(
        "Kaira Guard error:",
        error,
      );

      setGuardStatus("error");
    }
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Future Collision
        </p>

        <h2 className="mt-2 text-2xl font-semibold">
          What if I buy something?
        </h2>

        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Kaira projects how a purchase today
          could affect your upcoming commitments.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-zinc-400">
            What are you thinking of buying?
          </span>

          <input
            value={purchaseName}
            onChange={(event) => {
              setPurchaseName(
                event.target.value,
              );

              setGuardStatus("idle");
            }}
            placeholder="e.g. Headphones"
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm text-zinc-400">
            Price
          </span>

          <input
            type="number"
            min="0"
            value={purchaseAmount}
            onChange={(event) =>
              changePurchaseAmount(
                Number(event.target.value),
              )
            }
            className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[500, 2000, 3500, 6000, 8000].map(
          (amount) => (
            <button
              key={amount}
              type="button"
              onClick={() =>
                changePurchaseAmount(amount)
              }
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
            >
              {formatMoney(amount)}
            </button>
          ),
        )}
      </div>

      {purchaseAmount > 0 && (
        <div
          className={`mt-8 rounded-3xl border p-6 ${risk.className}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-400">
                Kaira&apos;s assessment
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {risk.icon} {risk.label}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-zinc-400">
                Purchase
              </p>

              <p className="font-medium">
                {formatMoney(
                  purchaseAmount,
                )}
              </p>
            </div>
          </div>

          <p className="mt-6 max-w-2xl text-zinc-200">
            {simulation.message}
          </p>

          {simulation.riskLevel !==
            "safe" && (
            <div className="mt-6">
              <button
                type="button"
                onClick={
                  activateKairaGuard
                }
                disabled={
                  guardStatus ===
                  "loading"
                }
                className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {guardStatus ===
                  "idle" &&
                  "Protect my budget"}

                {guardStatus ===
                  "loading" &&
                  "Activating protection..."}

                {guardStatus ===
                  "protected" &&
                  "✓ Kaira Guard active"}

                {guardStatus ===
                  "error" &&
                  "Try again"}
              </button>

              {guardStatus ===
                "protected" && (
                <p className="mt-3 text-sm text-zinc-400">
                  Kaira will watch this risk
                  and help you stay ahead of
                  your upcoming commitments.
                </p>
              )}
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-zinc-500">
                Before
              </p>

              <p className="mt-1 text-lg font-medium">
                {formatMoney(
                  simulation.safeToSpendBefore,
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-zinc-500">
                After
              </p>

              <p className="mt-1 text-lg font-medium">
                {formatMoney(
                  simulation.safeToSpendAfter,
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-zinc-500">
                Upcoming commitments
              </p>

              <p className="mt-1 text-lg font-medium">
                {formatMoney(
                  simulation.upcomingExpenses,
                )}
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm text-zinc-500">
            Simulating:{" "}
            <span className="text-zinc-300">
              {purchaseName ||
                "New purchase"}
            </span>
          </p>
        </div>
      )}
    </section>
  );
}