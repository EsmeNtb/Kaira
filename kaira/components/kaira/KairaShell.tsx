import type {
  ReactNode,
} from "react";

import BottomNav from "./BottomNav";

interface KairaShellProps {
  children: ReactNode;
}

export default function KairaShell({
  children,
}: KairaShellProps) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 mx-auto h-80 max-w-md">

        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-peach/10 blur-[100px]" />

        <div className="absolute left-6 top-10 h-56 w-56 rounded-full bg-lavender/10 blur-[90px]" />

        <div className="absolute right-6 top-20 h-56 w-56 rounded-full bg-mint/10 blur-[90px]" />
      </div>

      <main className="relative mx-auto min-h-screen max-w-md px-5 pb-32 pt-6">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}