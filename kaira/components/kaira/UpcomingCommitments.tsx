"use client";

import { useState } from "react";

import {
  ArrowDownLeft,
  Box,
  Car,
  Film,
  Play,
  ShoppingBag,
  Smartphone,
  Utensils,
  type LucideIcon,
} from "lucide-react";

import type {
  Transaction,
  UpcomingCharge,
} from "@/lib/types/finance";

import { formatMoney } from "@/lib/utils/format-money";

interface UpcomingCommitmentsProps {
  upcomingCharges: UpcomingCharge[];
  transactions: Transaction[];
}

export default function UpcomingCommitments({
  upcomingCharges,
  transactions,
}: UpcomingCommitmentsProps) {
  const [tab, setTab] =
    useState<
      "upcoming" | "history"
    >("upcoming");

  const recentTransactions =
    [...transactions]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      )
      .slice(0, 12);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Next 30 days
          </p>

          <h2 className="mt-0.5 text-xl font-bold">
            Upcoming commitments
          </h2>
        </div>

        <span className="text-[11px] text-muted-foreground">
          Predicted by Kaira
        </span>
      </div>

      <div className="inline-flex rounded-full border border-border/70 bg-card p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() =>
            setTab("upcoming")
          }
          className={`rounded-full px-4 py-1.5 transition ${
            tab === "upcoming"
              ? "bg-peach text-peach-foreground"
              : "text-muted-foreground"
          }`}
        >
          Upcoming
        </button>

        <button
          type="button"
          onClick={() =>
            setTab("history")
          }
          className={`rounded-full px-4 py-1.5 transition ${
            tab === "history"
              ? "bg-peach text-peach-foreground"
              : "text-muted-foreground"
          }`}
        >
          History
        </button>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">

        {tab === "upcoming" &&
          upcomingCharges.map(
            (charge) => {
              const Icon =
                getIcon(
                  charge.merchant,
                );

              return (
                <div
                  key={`${charge.merchant}-${charge.expectedDate}`}
                  className="w-44 shrink-0 rounded-2xl border border-border/70 bg-card p-4 transition hover:border-mint/40"
                >
                  <div className="flex items-center justify-between">
                    <IconBox
                      Icon={Icon}
                    />

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${confidenceTone(
                        charge.confidence,
                      )}`}
                    >
                      {Math.round(
                        charge.confidence *
                          100,
                      )}
                      %
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-bold tracking-tight">
                    {charge.merchant}
                  </p>

                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Expected{" "}
                    {formatDate(
                      charge.expectedDate,
                    )}
                  </p>

                  <p className="mt-2 text-lg font-extrabold">
                    {formatMoney(
                      charge.amount,
                    )}
                  </p>
                </div>
              );
            },
          )}

        {tab === "history" &&
          recentTransactions.map(
            (transaction) => {
              const Icon =
                getIcon(
                  transaction.merchant,
                  transaction.category,
                );

              const income =
                transaction.type ===
                "income";

              return (
                <div
                  key={transaction.id}
                  className="w-44 shrink-0 rounded-2xl border border-border/70 bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <IconBox
                      Icon={Icon}
                    />

                    <span className="text-[10px] font-bold text-muted-foreground">
                      {transaction.category ??
                        "Other"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-bold tracking-tight">
                    {
                      transaction.merchant
                    }
                  </p>

                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Completed{" "}
                    {formatDate(
                      transaction.date,
                    )}
                  </p>

                  <p
                    className={`mt-2 text-lg font-extrabold ${
                      income
                        ? "text-mint"
                        : "text-muted-foreground"
                    }`}
                  >
                    {income
                      ? "+"
                      : "−"}{" "}
                    {formatMoney(
                      transaction.amount,
                    )}
                  </p>
                </div>
              );
            },
          )}
      </div>
    </section>
  );
}

function confidenceTone(
  confidence: number,
) {
  const value =
    confidence <= 1
      ? confidence * 100
      : confidence;

  if (value >= 95) {
    return "text-mint bg-mint/10";
  }

  if (value >= 85) {
    return "text-lavender bg-lavender/10";
  }

  return "text-warning bg-warning/10";
}

function formatDate(
  date: string,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(`${date}T00:00:00Z`),
  );
}

function getIcon(
  merchant: string,
  category?: string,
): LucideIcon {
  const normalized =
    merchant.toUpperCase();

  if (
    normalized.includes("TELCEL")
  ) {
    return Smartphone;
  }

  if (
    normalized.includes(
      "NETFLIX",
    ) ||
    normalized.includes(
      "DISNEY",
    ) ||
    normalized === "MAX"
  ) {
    return Film;
  }

  if (
    normalized.includes(
      "SPOTIFY",
    ) ||
    normalized.includes(
      "XLAG",
    ) ||
    normalized.includes(
      "XBOX",
    )
  ) {
    return Play;
  }

  if (
    category ===
      "Transportation" ||
    normalized.includes("UBER")
  ) {
    return Car;
  }

  if (
    category === "Food" ||
    category === "Dining"
  ) {
    return Utensils;
  }

  if (
    category ===
      "Shopping" ||
    category ===
      "Groceries" ||
    category ===
      "Convenience"
  ) {
    return ShoppingBag;
  }

  if (
    category === "Income" ||
    category === "Transfer"
  ) {
    return ArrowDownLeft;
  }

  return Box;
}

function IconBox({
  Icon,
}: {
  Icon: LucideIcon;
}) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60">
      <Icon className="h-4 w-4 text-lavender" />
    </div>
  );
}