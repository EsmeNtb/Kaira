import {
  CreditCard,
  Plus,
} from "lucide-react";

import {
  formatMoney,
} from "@/lib/utils/format-money";

export interface Wallet {
  name: string;
  type: string;
  balance: number;
  tint?: string;
}

interface DemoWalletsProps {
  wallets: Wallet[];
}

export default function DemoWallets({
  wallets = [],
}: DemoWalletsProps) {
  return (
    <section className="space-y-3">

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Consolidated
          </p>

          <h2 className="mt-0.5 text-xl font-bold">
            Linked accounts
          </h2>
        </div>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-peach/25 bg-peach/15 text-peach"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2.5">

        {wallets.map((wallet) => {
          const negative =
            wallet.balance < 0;

          const tint =
            wallet.tint ??
            "#a78bfa";

          return (
            <div
              key={wallet.name}
              className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor:
                    `${tint}22`,

                  border:
                    `1px solid ${tint}44`,
                }}
              >
                <CreditCard
                  className="h-4 w-4"
                  style={{
                    color: tint,
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {wallet.name}
                </p>

                <p className="text-[11px] text-muted-foreground">
                  {wallet.type}
                </p>
              </div>

              <p
                className={`text-sm font-bold ${
                  negative
                    ? "text-destructive"
                    : "text-foreground"
                }`}
              >
                {negative
                  ? "− "
                  : ""}

                {formatMoney(
                  Math.abs(
                    wallet.balance,
                  ),
                )}
              </p>
            </div>
          );
        })}

      </div>
    </section>
  );
}