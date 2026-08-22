"use client";

import { useState } from "react";

import {
  Eye,
  MessageCircle,
  X,
  Zap,
} from "lucide-react";

import type {
  RecurringPayment,
} from "@/lib/types/finance";

import { formatMoney } from "@/lib/utils/format-money";

type ControlKey =
  | "auto-pay"
  | "ask-me"
  | "watch"
  | "cancel";

interface RecurringControlsProps {
  recurringPayments: RecurringPayment[];
}

const controls = [
  {
    key: "auto-pay",
    label: "Auto-pay",
    Icon: Zap,
    className:
      "bg-mint/15 text-mint border-mint/30",
  },

  {
    key: "ask-me",
    label: "Ask me first",
    Icon: MessageCircle,
    className:
      "bg-lavender/15 text-lavender border-lavender/30",
  },

  {
    key: "watch",
    label: "Watch closely",
    Icon: Eye,
    className:
      "bg-warning/15 text-warning border-warning/30",
  },

  {
    key: "cancel",
    label: "Cancel",
    Icon: X,
    className:
      "bg-destructive/15 text-destructive border-destructive/30",
  },
] as const;

export default function RecurringControls({
  recurringPayments,
}: RecurringControlsProps) {
  const [selected, setSelected] =
    useState<
      Record<
        string,
        ControlKey
      >
    >({});

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lavender">
            Proactive
          </p>

          <h2 className="mt-0.5 text-xl font-bold">
            Recurring charges
          </h2>
        </div>

        <span className="text-[11px] text-muted-foreground">
          Kaira manages
        </span>
      </div>

      {/* SCROLL CONTAINER */}
      <div className="rounded-[1.75rem] border border-border/70 bg-card/40 p-2">
        <div className="no-scrollbar max-h-[28rem] space-y-2.5 overflow-y-auto pr-1">

          {recurringPayments.map(
            (payment) => {
              const current =
                selected[
                  payment.merchant
                ] ?? "watch";

              return (
                <div
                  key={
                    payment.merchant
                  }
                  className="rounded-2xl border border-border/70 bg-card p-4"
                >
                  <p className="text-sm font-bold">
                    {
                      payment.merchant
                    }
                  </p>

                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatMoney(
                      payment.averageAmount,
                    )}
                    {" · "}
                    {payment.frequency}
                    {" · next "}
                    {
                      payment.nextExpectedDate
                    }
                  </p>

                  <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
                    {controls.map(
                      ({
                        key,
                        label,
                        Icon,
                        className,
                      }) => {
                        const active =
                          current === key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              setSelected(
                                (
                                  previous,
                                ) => ({
                                  ...previous,

                                  [payment.merchant]:
                                    key,
                                }),
                              )
                            }
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                              active
                                ? className
                                : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-3 w-3" />

                            {label}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              );
            },
          )}

        </div>
      </div>
    </section>
  );
}