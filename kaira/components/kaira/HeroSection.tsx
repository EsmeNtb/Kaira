"use client";

import { useState } from "react";

import {
  ChevronDown,
  Sparkles,
} from "lucide-react";

import Mascot from "./Mascot";

import { formatMoney } from "@/lib/utils/format-money";

interface HeroSectionProps {
  name?: string;
  currentBalance: number;
  safeToSpend: number;
  upcomingCommitments: number;
  safetyReserve: number;
  demoMode?: boolean;
}

export default function HeroSection({
  name = "Alex",
  currentBalance,
  safeToSpend,
  upcomingCommitments,
  safetyReserve,
  demoMode = true,
}: HeroSectionProps) {
  const [open, setOpen] =
    useState(false);

  return (
    <section className="space-y-3">

      {/* USER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            Good morning
          </p>

          <h1 className="text-lg font-bold">
            {name}
          </h1>
        </div>

        {demoMode && (
          <span className="inline-flex items-center gap-1 rounded-full border border-kaira-orange/20 bg-kaira-orange/10 px-2.5 py-1 text-[11px] font-semibold text-kaira-orange">
            <Sparkles className="h-3 w-3" />
            Demo
          </span>
        )}
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-kaira-orange/15 bg-gradient-to-br from-card via-card to-kaira-purple/10 p-5 shadow-[0_0_45px_-20px_rgba(60,187,177,0.35)]">
        <div className="relative z-20 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kaira-teal">
            Safe to spend
          </p>

            <p className="mt-1 text-[2.6rem] font-extrabold leading-none tracking-tight">
              {formatMoney(safeToSpend)}
            </p>

            <p className="mt-2 max-w-[230px] text-xs leading-relaxed text-muted-foreground">
              Available without compromising
              your next 30 days.
            </p>
          </div>

          <Mascot
            size={88}
            className="mt-2 shrink-0 "
          />
        </div>

        {/* CALCULATION */}
        <button
          type="button"
          onClick={() =>
            setOpen(
              (value) => !value,
            )
          }
          className="relative z-20 mt-4 flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-left"
        >
          <span className="text-xs font-medium text-muted-foreground">
            Current balance ·{" "}
            {formatMoney(
              currentBalance,
            )}
          </span>

          <span className="flex items-center gap-1 text-xs font-semibold">
            How Kaira calculated this

            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                open
                  ? "rotate-180"
                  : ""
              }`}
            />
          </span>
        </button>

        {open && (
          <div className="relative z-20 mt-2 space-y-2 rounded-2xl border border-border/60 bg-background/70 p-4">

            <div className="flex items-center justify-between text-[10px] font-semibold tracking-wide text-muted-foreground">
              <span>
                HOW KAIRA CALCULATED THIS
              </span>

              <span>
                NEXT 30 DAYS
              </span>
            </div>

            <Row
              label="Current balance"
              value={formatMoney(
                currentBalance,
              )}
            />

            <Row
              label="Upcoming commitments"
              value={`− ${formatMoney(
                upcomingCommitments,
              )}`}
            />

            <Row
              label="Safety reserve"
              value={`− ${formatMoney(
                safetyReserve,
              )}`}
            />

            <div className="my-1 border-t border-border/70" />

            <Row
              label="Safe to spend"
              value={formatMoney(
                safeToSpend,
              )}
              bold
              accent
            />
          </div>
        )}

      </div>
    </section>
  );
}

interface RowProps {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}

function Row({
  label,
  value,
  bold = false,
  accent = false,
}: RowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span
        className={
          bold
            ? "font-semibold"
            : "text-muted-foreground"
        }
      >
        {label}
      </span>

      <span
        className={`${
          bold
            ? "text-base font-bold"
            : "font-medium"
        } ${
          accent
            ? "text-kaira-teal"
            : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}