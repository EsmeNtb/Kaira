import {
  ChevronRight,
  GraduationCap,
  Laptop,
  Plane,
  Shield,
  type LucideIcon,
} from "lucide-react";

import {
  formatMoney,
} from "@/lib/utils/format-money";

const goals = [
  {
    name: "Emergency fund",
    target: 30000,
    current: 18500,
    Icon: Shield,
    tint: "mint",
  },
  {
    name: "Exchange trip",
    target: 50000,
    current: 12400,
    Icon: Plane,
    tint: "lavender",
  },
  {
    name: "New laptop",
    target: 25000,
    current: 9800,
    Icon: Laptop,
    tint: "peach",
  },
  {
    name: "Tuition support",
    target: 40000,
    current: 6000,
    Icon: GraduationCap,
    tint: "warning",
  },
];

const tones: Record<
  string,
  {
    bar: string;
    text: string;
    border: string;
  }
> = {
  mint: {
    bar: "bg-mint",
    text: "text-mint",
    border: "border-mint/30",
  },

  lavender: {
    bar: "bg-lavender",
    text: "text-lavender",
    border: "border-lavender/30",
  },

  peach: {
    bar: "bg-peach",
    text: "text-peach",
    border: "border-peach/30",
  },

  warning: {
    bar: "bg-warning",
    text: "text-warning",
    border: "border-warning/30",
  },
};

interface SavingGoalsProps {
  showHeader?: boolean;
  variant?: "home" | "page";
}

export default function SavingGoals({
  showHeader = true,
  variant = "home",
}: SavingGoalsProps) {
  const totalSaved =
    goals.reduce(
      (total, goal) =>
        total + goal.current,
      0,
    );

  const totalTarget =
    goals.reduce(
      (total, goal) =>
        total + goal.target,
      0,
    );

  const totalProgress =
    Math.round(
      (totalSaved / totalTarget) *
        100,
    );

  return (
    <section className="space-y-4">

      {/* HOME HEADER */}
      {showHeader && (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Saving for
            </p>

            <h2 className="mt-0.5 text-xl font-bold">
              Savings goals
            </h2>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-peach"
          >
            New goal

            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ONLY ON GOALS PAGE */}
      {variant === "page" && (
        <div className="rounded-[1.75rem] border border-peach/25 bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-peach">
            Total saved
          </p>

          <p className="mt-1 text-3xl font-extrabold">
            {formatMoney(
              totalSaved,
            )}
          </p>

          <p className="mt-1 text-[11px] text-muted-foreground">
            of{" "}
            {formatMoney(
              totalTarget,
            )}{" "}
            across {goals.length} goals
          </p>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background/60">
            <div
              className="h-full rounded-full bg-peach"
              style={{
                width:
                  `${totalProgress}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* HOME = GRID / GOALS PAGE = LIST */}
      <div
        className={
          variant === "page"
            ? "space-y-2.5"
            : "grid grid-cols-2 gap-3"
        }
      >
        {goals.map((goal) => {
          const percentage =
            Math.round(
              (goal.current /
                goal.target) *
                100,
            );

          const tone =
            tones[goal.tint];

          const Icon:
            LucideIcon =
            goal.Icon;

          if (
            variant === "page"
          ) {
            return (
              <div
                key={goal.name}
                className={`flex items-center gap-3 rounded-2xl border bg-card p-4 ${tone.border}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60">
                  <Icon
                    className={`h-4 w-4 ${tone.text}`}
                  />
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">
                        {goal.name}
                      </p>

                      <p className="text-[10px] text-muted-foreground">
                        {formatMoney(
                          goal.target -
                            goal.current,
                        )}{" "}
                        to go
                      </p>
                    </div>

                    <p
                      className={`text-sm font-bold ${tone.text}`}
                    >
                      {percentage}%
                    </p>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background/60">
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{
                        width:
                          `${percentage}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      {formatMoney(
                        goal.current,
                      )}{" "}
                      saved
                    </span>

                    <span>
                      {formatMoney(
                        goal.target,
                      )}{" "}
                      goal
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={goal.name}
              className="rounded-2xl border border-border/70 bg-card p-4"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60">
                <Icon
                  className={`h-4 w-4 ${tone.text}`}
                />
              </div>

              <p className="mt-3 text-sm font-bold">
                {goal.name}
              </p>

              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {formatMoney(
                  goal.current,
                )}
                {" / "}
                {formatMoney(
                  goal.target,
                )}
              </p>

              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-background/60">
                <div
                  className={`h-full rounded-full ${tone.bar}`}
                  style={{
                    width:
                      `${percentage}%`,
                  }}
                />
              </div>

              <p
                className={`mt-1.5 text-[11px] font-bold ${tone.text}`}
              >
                {percentage}%
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}