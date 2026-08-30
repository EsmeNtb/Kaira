import {
  LockKeyhole,
} from "lucide-react";

import KairaShell from "@/components/kaira/KairaShell";

import PrivateFinancialIdentity from "@/components/kaira/PrivateFinancialIdentity";

export const dynamic =
  "force-dynamic";

export default function IdentityPage() {
  return (
    <KairaShell>
      <div className="space-y-6">

        <header>
          <div className="flex items-center gap-2 text-kaira-orange">
            <LockKeyhole className="h-4 w-4" />

            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
              Private identity
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-bold">
            Verify without revealing
          </h1>

          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Prove financial eligibility
            without publishing your raw
            financial information.
          </p>

          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Powered by Midnight
            zero-knowledge proofs.
          </p>
        </header>

        <PrivateFinancialIdentity />

      </div>
    </KairaShell>
  );
}