"use client";

import Link from "next/link";

import {
  Activity,
  Home,
  Shield,
  Target,
  UserRound,
} from "lucide-react";

import {
  usePathname,
} from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },

  {
    href: "/activity",
    label: "Activity",
    icon: Activity,
  },

  {
    href: "/guard",
    label: "Guard",
    icon: Shield,
  },

  {
    href: "/goals",
    label: "Goals",
    icon: Target,
  },

  {
    href: "/profile",
    label: "Profile",
    icon: UserRound,
  },
];

export default function BottomNav() {
  const pathname =
    usePathname();

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4 pb-4">
      <nav className="flex items-center justify-between rounded-full border border-border/80 bg-card/90 px-2 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl">

        {tabs.map(
          ({
            href,
            label,
            icon: Icon,
          }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : href === "/profile"
                  ? pathname.startsWith(
                      "/profile",
                    ) ||
                    pathname.startsWith(
                      "/identity",
                    )
                  : pathname.startsWith(
                      href,
                    );

            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-2 transition-all duration-300 ${
                  active
                    ? "bg-peach/15 text-peach"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={2.2}
                />

                <span className="text-[10px] font-semibold tracking-wide">
                  {label}
                </span>
              </Link>
            );
          },
        )}

      </nav>
    </div>
  );
}