"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Loader2,
  Volume2,
} from "lucide-react";

import {
  simulatePurchase,
} from "@/lib/engines/collision-engine";

import type {
  UpcomingCharge,
} from "@/lib/types/finance";

import {
  formatMoney,
} from "@/lib/utils/format-money";

interface PurchaseSimulatorProps {
  currentBalance: number;
  upcomingCharges: UpcomingCharge[];
  safetyBuffer: number;
}

export function PurchaseSimulator({
  currentBalance,
  upcomingCharges,
  safetyBuffer,
}: PurchaseSimulatorProps) {
  const [
    purchaseName,
    setPurchaseName,
  ] = useState(
    "Headphones",
  );

  const [
    purchaseAmount,
    setPurchaseAmount,
  ] = useState(
    3500,
  );

  const [
    guardStatus,
    setGuardStatus,
  ] = useState<
    | "idle"
    | "loading"
    | "protected"
    | "error"
  >("idle");

  const [
    guardRecommendation,
    setGuardRecommendation,
  ] = useState<
    string | null
  >(null);

  const [
    voiceStatus,
    setVoiceStatus,
  ] = useState<
    | "idle"
    | "loading"
    | "playing"
    | "error"
  >("idle");

  const simulation =
    useMemo(() => {
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
      label:
        "Looks safe",

      dot:
        "bg-mint",

      text:
        "text-mint",

      border:
        "border-mint/25",

      background:
        "bg-mint/10",
    },

    warning: {
      label:
        "Proceed carefully",

      dot:
        "bg-warning",

      text:
        "text-warning",

      border:
        "border-warning/25",

      background:
        "bg-warning/10",
    },

    danger: {
      label:
        "High risk",

      dot:
        "bg-destructive",

      text:
        "text-destructive",

      border:
        "border-destructive/25",

      background:
        "bg-destructive/10",
    },
  };

  const risk =
    riskConfig[
      simulation.riskLevel
    ];

  function resetGuard() {
    setGuardStatus(
      "idle",
    );

    setGuardRecommendation(
      null,
    );

    setVoiceStatus(
      "idle",
    );
  }

  function changePurchaseAmount(
    amount: number,
  ) {
    setPurchaseAmount(
      amount,
    );

    resetGuard();
  }

  async function playKairaWarning(
    message?: string,
  ) {
    try {
      setVoiceStatus(
        "loading",
      );

      const response =
        await fetch(
          "/api/voice-warning",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                purchaseName,

                purchaseAmount,

                safeToSpendAfter:
                  simulation.safeToSpendAfter,

                upcomingExpenses:
                  simulation.upcomingExpenses,

                /*
                 * If message is empty,
                 * the API generates the
                 * normal financial warning.
                 *
                 * If Guard sends a message,
                 * Kaira speaks that instead.
                 */
                message,
              }),
          },
        );

      if (
        !response.ok
      ) {
        const result =
          await response
            .json()
            .catch(
              () =>
                null,
            );

        throw new Error(
          result?.message ??
            "Unable to generate Kaira voice.",
        );
      }

      const audioBlob =
        await response.blob();

      const audioUrl =
        URL.createObjectURL(
          audioBlob,
        );

      const audio =
        new Audio(
          audioUrl,
        );

      audio.onended =
        () => {
          URL.revokeObjectURL(
            audioUrl,
          );

          setVoiceStatus(
            "idle",
          );
        };

      audio.onerror =
        () => {
          URL.revokeObjectURL(
            audioUrl,
          );

          setVoiceStatus(
            "error",
          );
        };

      setVoiceStatus(
        "playing",
      );

      await audio.play();
    } catch (error) {
      console.error(
        "Kaira voice error:",
        error,
      );

      setVoiceStatus(
        "error",
      );
    }
  }

  async function activateKairaGuard() {
    try {
      setGuardStatus(
        "loading",
      );

      setGuardRecommendation(
        null,
      );

      const response =
        await fetch(
          "/api/guard",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
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

      if (
        !response.ok
      ) {
        throw new Error(
          "Unable to activate Kaira Guard.",
        );
      }

      const result =
        await response.json();

      const recommendation =
        result.workflow
          ?.recommendation ??
        result.message ??
        "Delay this purchase until your upcoming commitments are covered.";

      setGuardRecommendation(
        recommendation,
      );

      setGuardStatus(
        "protected",
      );

      /*
       * For high-risk purchases,
       * Kaira automatically speaks
       * the Guard recommendation.
       */
      if (
        simulation.riskLevel ===
        "danger"
      ) {
        await playKairaWarning(
          `Kaira Guard activated. ${recommendation}`,
        );
      }
    } catch (error) {
      console.error(
        "Kaira Guard error:",
        error,
      );

      setGuardStatus(
        "error",
      );
    }
  }

  return (
    <section className="space-y-3">

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-peach">
          Future collision
        </p>

        <h2 className="mt-1 text-xl font-bold">
          What if I buy something?
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Kaira projects how a purchase today
          could affect your upcoming commitments.
        </p>
      </div>

      <div className="space-y-4 rounded-[1.75rem] border border-border/70 bg-card p-4">

        {/* INPUTS */}
        <div className="grid grid-cols-2 gap-3">

          <label className="space-y-1.5">

            <span className="text-[11px] font-medium text-muted-foreground">
              What are you thinking of buying?
            </span>

            <input
              value={
                purchaseName
              }
              onChange={(
                event,
              ) => {
                setPurchaseName(
                  event.target
                    .value,
                );

                resetGuard();
              }}
              placeholder="e.g. Headphones"
              className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm font-medium outline-none transition focus:border-peach/60"
            />

          </label>

          <label className="space-y-1.5">

            <span className="text-[11px] font-medium text-muted-foreground">
              Price
            </span>

            <div className="flex items-center rounded-xl border border-border bg-background/60 px-3 py-2.5 focus-within:border-peach/60">

              <span className="mr-1 text-sm text-muted-foreground">
                MX$
              </span>

              <input
                type="number"
                min="0"
                value={
                  purchaseAmount
                }
                onChange={(
                  event,
                ) =>
                  changePurchaseAmount(
                    Number(
                      event.target
                        .value,
                    ),
                  )
                }
                className="w-full bg-transparent text-sm font-semibold outline-none"
              />

            </div>

          </label>

        </div>

        {/* PRESETS */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto">

          {[
            500,
            2000,
            3500,
            5000,
            6500,
          ].map(
            (
              amount,
            ) => (
              <button
                key={
                  amount
                }
                type="button"
                onClick={() =>
                  changePurchaseAmount(
                    amount,
                  )
                }
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  purchaseAmount ===
                  amount
                    ? "border-peach bg-peach text-peach-foreground"
                    : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {formatMoney(
                  amount,
                )}
              </button>
            ),
          )}

        </div>

        {/* ASSESSMENT */}
        {purchaseAmount >
          0 && (
          <div
            className={`space-y-4 rounded-2xl border p-4 ${risk.border} ${risk.background}`}
          >

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Kaira&apos;s assessment
                </p>

                <div className="mt-2 flex items-center gap-2">

                  <span
                    className={`h-3 w-3 rounded-full ${risk.dot}`}
                  />

                  <p className="text-lg font-bold">
                    {
                      risk.label
                    }
                  </p>

                </div>

              </div>

              <div className="text-right">

                <p className="text-[10px] text-muted-foreground">
                  Purchase
                </p>

                <p className="text-sm font-bold">
                  {formatMoney(
                    purchaseAmount,
                  )}
                </p>

              </div>

            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              {
                simulation.message
              }
            </p>

            <div className="grid grid-cols-3 gap-2">

              <MiniStat
                label="Before"
                value={formatMoney(
                  simulation.safeToSpendBefore,
                )}
              />

              <MiniStat
                label="After"
                value={formatMoney(
                  simulation.safeToSpendAfter,
                )}
                className={
                  risk.text
                }
              />

              <MiniStat
                label="Commitments"
                value={formatMoney(
                  simulation.upcomingExpenses,
                )}
              />

            </div>

            <div className="flex items-center justify-between gap-3">

              <p className="min-w-0 truncate text-[11px] text-muted-foreground">

                Simulating:{" "}

                <span className="font-medium text-foreground">
                  {purchaseName ||
                    "New purchase"}
                </span>

              </p>

              <div className="flex shrink-0 items-center gap-2">

                {/* HEAR KAIRA */}
                {simulation.riskLevel ===
                  "danger" && (
                  <button
                    type="button"
                    onClick={() =>
                      playKairaWarning()
                    }
                    disabled={
                      voiceStatus ===
                        "loading" ||
                      voiceStatus ===
                        "playing"
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-lavender/30 bg-lavender/10 px-3.5 py-2 text-[11px] font-bold text-lavender transition hover:bg-lavender/15 disabled:opacity-50"
                  >

                    {voiceStatus ===
                    "loading" ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />

                        Generating...
                      </>
                    ) : voiceStatus ===
                      "playing" ? (
                      <>
                        <Volume2 className="h-3.5 w-3.5" />

                        Speaking...
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5" />

                        Hear Kaira
                      </>
                    )}

                  </button>
                )}

                {/* KAIRA GUARD */}
                {simulation.riskLevel !==
                  "safe" && (
                  <button
                    type="button"
                    onClick={
                      activateKairaGuard
                    }
                    disabled={
                      guardStatus ===
                      "loading"
                    }
                    className={`rounded-full px-3.5 py-2 text-[11px] font-bold transition disabled:opacity-50 ${
                      simulation.riskLevel ===
                      "danger"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-peach text-peach-foreground"
                    }`}
                  >

                    {guardStatus ===
                      "idle" &&
                      "Protect my budget"}

                    {guardStatus ===
                      "loading" &&
                      "Protecting..."}

                    {guardStatus ===
                      "protected" &&
                      "✓ Guard active"}

                    {guardStatus ===
                      "error" &&
                      "Try again"}

                  </button>
                )}

              </div>

            </div>

            {/* VOICE ERROR */}
            {voiceStatus ===
              "error" && (
              <p className="text-[11px] text-destructive">
                Kaira could not generate the voice warning.
                Try again.
              </p>
            )}

            {/* GUARD RESULT */}
            {guardStatus ===
              "protected" && (
              <div className="rounded-xl border border-mint/20 bg-mint/10 p-3">

                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-mint">
                  Kaira Guard
                </p>

                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {guardRecommendation ??
                    "Protection workflow activated."}
                </p>

              </div>
            )}

          </div>
        )}

      </div>

    </section>
  );
}

function MiniStat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/45 p-3">

      <p className="text-[10px] text-muted-foreground">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-bold ${className}`}
      >
        {value}
      </p>

    </div>
  );
}