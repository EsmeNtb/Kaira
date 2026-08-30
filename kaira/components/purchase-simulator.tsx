"use client";

import {
  useState,
} from "react";

import {
  Loader2,
  ShieldCheck,
  Target,
  Volume2,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

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

interface MidnightProof {
  verified: boolean;
  transactionId: string;
  blockHeight: number;
}

interface ServerAssessment {
  riskLevel:
    | "safe"
    | "warning"
    | "danger";

  safeToSpendBefore: number;
  safeToSpendAfter: number;
  upcomingExpenses: number;
  message: string;
}

export function PurchaseSimulator(
  _props: PurchaseSimulatorProps,
) {
  const router =
    useRouter();

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
    assessment,
    setAssessment,
  ] =
    useState<ServerAssessment | null>(
      null,
    );

  const [
    simulationStatus,
    setSimulationStatus,
  ] = useState<
    | "idle"
    | "loading"
    | "done"
    | "error"
  >("idle");

  const [
    guardRecommendation,
    setGuardRecommendation,
  ] = useState<
    string | null
  >(null);

  const [
    midnightProof,
    setMidnightProof,
  ] = useState<
    MidnightProof | null
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

  const riskConfig = {
    safe: {
      label:
        "Looks safe",

      dot:
        "bg-kaira-teal",

      text:
        "text-kaira-teal",

      border:
        "border-kaira-teal/25",

      background:
        "bg-kaira-teal/10",
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
    assessment
      ? riskConfig[
          assessment.riskLevel
        ]
      : null;

  function resetSimulation() {
    setAssessment(
      null,
    );

    setSimulationStatus(
      "idle",
    );

    setGuardRecommendation(
      null,
    );

    setMidnightProof(
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

    resetSimulation();
  }

  async function simulatePrivately() {
    try {
      setSimulationStatus(
        "loading",
      );

      setAssessment(
        null,
      );

      setMidnightProof(
        null,
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
              }),
          },
        );

      const result =
        await response
          .json()
          .catch(
            () =>
              null,
          );

      if (
        !response.ok ||
        !result
      ) {
        throw new Error(
          result?.message ??
            "Unable to simulate purchase.",
        );
      }

      if (
        !result.assessment ||
        !result.midnight
      ) {
        throw new Error(
          "Private simulation returned an incomplete result.",
        );
      }

      setAssessment({
        riskLevel:
          result.assessment
            .riskLevel,

        safeToSpendBefore:
          result.assessment
            .safeToSpendBefore,

        safeToSpendAfter:
          result.assessment
            .safeToSpendAfter,

        upcomingExpenses:
          result.assessment
            .upcomingExpenses,

        message:
          result.assessment
            .message,
      });

      setMidnightProof({
        verified:
          result.midnight
            .verified,

        transactionId:
          result.midnight
            .transactionId,

        blockHeight:
          result.midnight
            .blockHeight,
      });

      /*
       * A Guard recommendation only
       * makes sense for a High Risk
       * result.
       */
      if (
        result.assessment
          .riskLevel ===
        "danger"
      ) {
        const recommendation =
          result.workflow
            ?.recommendation ??
          result.workflow
            ?.message ??
          result.message ??
          "Delay this purchase until your upcoming commitments are covered.";

        setGuardRecommendation(
          recommendation,
        );
      }

      setSimulationStatus(
        "done",
      );
    } catch (error) {
      console.error(
        "Private simulation error:",
        error,
      );

      setSimulationStatus(
        "error",
      );
    }
  }

  async function playKairaWarning(
    message?: string,
  ) {
    if (!assessment) {
      return;
    }

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
                  assessment
                    .safeToSpendAfter,

                upcomingExpenses:
                  assessment
                    .upcomingExpenses,

                message,
              }),
          },
        );

      if (!response.ok) {
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

  function addPurchaseToGoals() {
    const params =
      new URLSearchParams({
        name:
          purchaseName ||
          "Planned purchase",

        amount:
          String(
            purchaseAmount,
          ),

        source:
          "simulator",
      });

    router.push(
      `/goals?${params.toString()}`,
    );
  }

  return (
    <section className="space-y-3">

      {/* HEADER */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kaira-orange">
          Future collision
        </p>

        <h2 className="mt-1 text-xl font-bold">
          What if I buy something?
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Simulate a purchase
          privately before committing
          your money.
        </p>
      </div>

      {/* CARD */}
      <div className="space-y-4 rounded-[1.75rem] border border-border/70 bg-card p-4">

        {/* INPUTS */}
        <div className="grid grid-cols-2 gap-3">

          <label className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              What are you thinking
              of buying?
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

                resetSimulation();
              }}
              placeholder="e.g. Headphones"
              className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm font-medium outline-none transition focus:border-kaira-orange/60"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Price
            </span>

            <div className="flex items-center rounded-xl border border-border bg-background/60 px-3 py-2.5 transition focus-within:border-kaira-orange/60">

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
                    ? "border-kaira-orange bg-kaira-orange text-white"
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

        {/* SIMULATE */}
        <button
          type="button"
          onClick={
            simulatePrivately
          }
          disabled={
            simulationStatus ===
              "loading" ||
            purchaseAmount <= 0
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-kaira-orange px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {simulationStatus ===
          "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              Simulating privately...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />

              Simulate privately
            </>
          )}
        </button>

        <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
          Runs a real zero-knowledge
          verification with Midnight.
        </p>

        {/* SIMULATION ERROR */}
        {simulationStatus ===
          "error" && (
          <p className="text-center text-[11px] font-medium text-destructive">
            Kaira could not complete
            the private simulation.
            Try again.
          </p>
        )}

        {/* ASSESSMENT */}
        {assessment &&
          risk && (
          <div
            className={`space-y-4 rounded-2xl border p-4 ${risk.border} ${risk.background}`}
          >

            {/* STATUS */}
            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Kaira&apos;s
                  assessment
                </p>

                <div className="mt-2 flex items-center gap-2">

                  <span
                    className={`h-3 w-3 rounded-full ${risk.dot}`}
                  />

                  <p
                    className={`text-lg font-bold ${risk.text}`}
                  >
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

            {/* MESSAGE */}
            <p className="text-xs leading-relaxed text-muted-foreground">
              {
                assessment.message
              }
            </p>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-2">

              <MiniStat
                label="Before"
                value={formatMoney(
                  assessment
                    .safeToSpendBefore,
                )}
              />

              <MiniStat
                label="After"
                value={formatMoney(
                  assessment
                    .safeToSpendAfter,
                )}
                className={
                  risk.text
                }
              />

              <MiniStat
                label="Commitments"
                value={formatMoney(
                  assessment
                    .upcomingExpenses,
                )}
              />

            </div>

            {/* PURCHASE */}
            <p className="truncate text-[11px] text-muted-foreground">
              Simulated:{" "}
              <span className="font-medium text-foreground">
                {purchaseName ||
                  "New purchase"}
              </span>
            </p>

            {/* HIGH RISK ACTIONS */}
            {assessment
              .riskLevel ===
              "danger" && (
              <div className="flex items-center gap-2">

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
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-kaira-purple/40 bg-kaira-purple/20 px-3 py-2 text-[11px] font-bold text-lavender transition hover:bg-kaira-purple/30 disabled:opacity-50"
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

                <button
                  type="button"
                  onClick={
                    addPurchaseToGoals
                  }
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-kaira-orange px-3 py-2 text-[11px] font-bold text-white transition hover:brightness-110"
                >
                  <Target className="h-3.5 w-3.5" />

                  Add to Goals
                </button>

              </div>
            )}

            {/* WARNING ACTION */}
            {assessment
              .riskLevel ===
              "warning" && (
              <button
                type="button"
                onClick={
                  addPurchaseToGoals
                }
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-kaira-orange/30 bg-kaira-orange/10 px-3 py-2 text-[11px] font-bold text-kaira-orange transition hover:bg-kaira-orange/15"
              >
                <Target className="h-3.5 w-3.5" />

                Save for later
              </button>
            )}

            {/* VOICE ERROR */}
            {voiceStatus ===
              "error" && (
              <p className="text-[11px] font-medium text-destructive">
                Kaira could not
                generate the voice
                warning.
              </p>
            )}

            {/* GUARD RECOMMENDATION */}
            {assessment
              .riskLevel ===
              "danger" &&
              guardRecommendation && (
              <div className="rounded-xl border border-kaira-orange/20 bg-kaira-orange/10 p-3">

                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-kaira-orange">
                  Kaira Guard
                </p>

                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {
                    guardRecommendation
                  }
                </p>

              </div>
            )}

            {/* MIDNIGHT RECEIPT */}
            {midnightProof && (
              <div className="rounded-xl border border-kaira-purple/30 bg-kaira-purple/10 p-3">

                <div className="flex items-start gap-2">

                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-kaira-teal" />

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-kaira-teal">
                      Verified privately
                      with Midnight
                    </p>

                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                      Zero-knowledge
                      verification
                      completed.
                    </p>
                  </div>

                </div>

                <p className="mt-3 text-xs font-semibold">
                  {midnightProof
                    .verified
                    ? "Financial safety condition verified."
                    : "Financial safety condition not satisfied."}
                </p>

                <div className="mt-3 space-y-1.5 text-[10px] text-muted-foreground">

                  <p>
                    Block{" "}
                    <span className="font-semibold text-foreground">
                      {
                        midnightProof
                          .blockHeight
                      }
                    </span>
                  </p>

                  <p>
                    Tx{" "}
                    <span className="font-mono text-foreground">
                      {midnightProof
                        .transactionId
                        .slice(
                          0,
                          12,
                        )}
                      ...
                    </span>
                  </p>

                  <p>
                    Raw financial inputs
                    disclosed on-chain:{" "}
                    <span className="font-semibold text-kaira-teal">
                      none
                    </span>
                  </p>

                </div>

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