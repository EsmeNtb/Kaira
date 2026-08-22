import Link from "next/link";

import {
  Box,
  Car,
  Film,
  Play,
  ShoppingBag,
  Smartphone,
  Utensils,
  type LucideIcon,
} from "lucide-react";

import KairaShell from "@/components/kaira/KairaShell";
import SectionTitle from "@/components/kaira/SectionTitle";

import {
  getTransactions,
} from "@/lib/data/transactions";

import {
  detectRecurringPayments,
} from "@/lib/engines/recurring-engine";

import {
  forecastUpcomingCharges,
} from "@/lib/engines/forecast-engine";

import {
  formatMoney,
} from "@/lib/utils/format-money";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
  }>;
}) {
  const params =
    await searchParams;

  const tab =
    params.tab === "history"
      ? "history"
      : "upcoming";

  const accountId =
    process.env.DEMO_ACCOUNT_ID;

  if (!accountId) {
    throw new Error(
      "DEMO_ACCOUNT_ID is missing.",
    );
  }

  const transactions =
    await getTransactions(
      accountId,
    );

  const recurringPayments =
    detectRecurringPayments(
      transactions,
    );

  const upcomingCharges =
    forecastUpcomingCharges({
      recurringPayments,
      fromDate: "2026-08-22",
      days: 30,
    });

  const history =
    [...transactions]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      )
      .slice(0, 20);

  return (
    <KairaShell>
      <div className="space-y-6">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-peach">
            Kaira
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Activity
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Everything Kaira sees across your accounts.
          </p>
        </header>

        <div className="inline-flex rounded-full border border-border/70 bg-card p-1">
          <Link
            href="/activity?tab=upcoming"
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              tab === "upcoming"
                ? "bg-peach text-peach-foreground"
                : "text-muted-foreground"
            }`}
          >
            Upcoming
          </Link>

          <Link
            href="/activity?tab=history"
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              tab === "history"
                ? "bg-peach text-peach-foreground"
                : "text-muted-foreground"
            }`}
          >
            History
          </Link>
        </div>

        <div className="space-y-2.5">
          {tab === "upcoming" &&
            upcomingCharges.map(
              (charge) => (
                <ActivityRow
                  key={`${charge.merchant}-${charge.expectedDate}`}
                  merchant={charge.merchant}
                  subtitle={`Expected ${formatDate(
                    charge.expectedDate,
                  )}`}
                  amount={charge.amount}
                  confidence={Math.round(
                    charge.confidence * 100,
                  )}
                />
              ),
            )}

          {tab === "history" &&
            history.map(
              (transaction) => (
                <ActivityRow
                  key={transaction.id}
                  merchant={
                    transaction.merchant
                  }
                  subtitle={`${transaction.category ?? "Other"} · ${formatDate(
                    transaction.date,
                  )}`}
                  amount={
                    transaction.amount
                  }
                  type={
                    transaction.type
                  }
                />
              ),
            )}
        </div>

        <SectionTitle>
          Insights
        </SectionTitle>

        <div className="rounded-2xl border border-lavender/25 bg-lavender/5 p-4">
          <p className="text-sm font-bold">
            Spending is steady this week
          </p>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Kaira noticed your recurring charges
            are consistent. No surprises predicted
            for the next 7 days.
          </p>
        </div>
      </div>
    </KairaShell>
  );
}

function ActivityRow({
  merchant,
  subtitle,
  amount,
  confidence,
  type = "expense",
}: {
  merchant: string;
  subtitle: string;
  amount: number;
  confidence?: number;
  type?: "income" | "expense";
}) {
  const Icon =
    getIcon(merchant);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60">
        <Icon className="h-4 w-4 text-lavender" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">
          {merchant}
        </p>

        <p className="text-[11px] text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <div className="text-right">
        <p
          className={`text-sm font-bold ${
            type === "income"
              ? "text-mint"
              : "text-foreground"
          }`}
        >
          {type === "income" && "+"}

          {formatMoney(
            Math.abs(amount),
          )}
        </p>

        {confidence !== undefined && (
          <p className="text-[10px] font-semibold text-mint">
            {confidence}% confidence
          </p>
        )}
      </div>
    </div>
  );
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      `${value}T00:00:00Z`,
    ),
  );
}

function getIcon(
  merchant: string,
): LucideIcon {
  const name =
    merchant.toUpperCase();

  if (name.includes("TELCEL")) {
    return Smartphone;
  }

  if (
    name.includes("NETFLIX") ||
    name.includes("DISNEY") ||
    name === "MAX"
  ) {
    return Film;
  }

  if (
    name.includes("SPOTIFY") ||
    name.includes("XLAG") ||
    name.includes("XBOX")
  ) {
    return Play;
  }

  if (name.includes("UBER")) {
    return Car;
  }

  if (
    name.includes("OXXO") ||
    name.includes("AMAZON")
  ) {
    return ShoppingBag;
  }

  if (
    name.includes("EATS") ||
    name.includes("RAPPI")
  ) {
    return Utensils;
  }

  return Box;
}