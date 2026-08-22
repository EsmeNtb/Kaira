"use client";

import {
  useState,
  type FormEvent,
} from "react";

import {
  ArrowRightLeft,
  Car,
  ChevronRight,
  Gift,
  GraduationCap,
  House,
  Laptop,
  Loader2,
  PiggyBank,
  Plane,
  Plus,
  Shield,
  Target,
  Undo2,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  formatMoney,
} from "@/lib/utils/format-money";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  icon: string;
}

interface SavingGoalsProps {
  goals: SavingsGoal[];
  showHeader?: boolean;
  variant?: "home" | "page";
}

type GoalAction =
  | "add"
  | "move"
  | "release";

const iconMap:
  Record<
    string,
    LucideIcon
  > = {
  shield: Shield,
  plane: Plane,
  laptop: Laptop,
  education:
    GraduationCap,
  house: House,
  car: Car,
  gift: Gift,
  "piggy-bank":
    PiggyBank,
  target: Target,
};

const iconOptions = [
  {
    key: "shield",
    Icon: Shield,
  },
  {
    key: "plane",
    Icon: Plane,
  },
  {
    key: "laptop",
    Icon: Laptop,
  },
  {
    key: "education",
    Icon:
      GraduationCap,
  },
  {
    key: "house",
    Icon: House,
  },
  {
    key: "car",
    Icon: Car,
  },
  {
    key: "gift",
    Icon: Gift,
  },
  {
    key:
      "piggy-bank",
    Icon: PiggyBank,
  },
  {
    key: "target",
    Icon: Target,
  },
];

const tones = [
  {
    bar: "bg-mint",
    text: "text-mint",
    border:
      "border-mint/30",
  },
  {
    bar:
      "bg-lavender",
    text:
      "text-lavender",
    border:
      "border-lavender/30",
  },
  {
    bar: "bg-peach",
    text: "text-peach",
    border:
      "border-peach/30",
  },
  {
    bar:
      "bg-warning",
    text:
      "text-warning",
    border:
      "border-warning/30",
  },
];

export default function SavingGoals({
  goals,
  showHeader = true,
  variant = "home",
}: SavingGoalsProps) {
  const router =
    useRouter();

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    selectedGoal,
    setSelectedGoal,
  ] =
    useState<SavingsGoal | null>(
      null,
    );

  const [
    action,
    setAction,
  ] =
    useState<GoalAction | null>(
      null,
    );

  const [
    name,
    setName,
  ] = useState("");

  const [
    targetAmount,
    setTargetAmount,
  ] = useState("");

  const [
    savedAmount,
    setSavedAmount,
  ] = useState("0");

  const [
    selectedIcon,
    setSelectedIcon,
  ] = useState(
    "target",
  );

  const [
    actionAmount,
    setActionAmount,
  ] = useState("");

  const [
    destinationId,
    setDestinationId,
  ] = useState("");

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  const totalSaved =
    goals.reduce(
      (
        total,
        goal,
      ) =>
        total +
        goal.savedAmount,
      0,
    );

  const totalTarget =
    goals.reduce(
      (
        total,
        goal,
      ) =>
        total +
        goal.targetAmount,
      0,
    );

  const totalProgress =
    totalTarget > 0
      ? Math.min(
          100,
          Math.round(
            (totalSaved /
              totalTarget) *
              100,
          ),
        )
      : 0;

  function openCreate() {
    setName("");
    setTargetAmount("");
    setSavedAmount("0");
    setSelectedIcon(
      "target",
    );
    setErrorMessage(
      null,
    );
    setCreateOpen(
      true,
    );
  }

  function openManage(
    goal: SavingsGoal,
  ) {
    setSelectedGoal(
      goal,
    );
    setAction(null);
    setActionAmount("");
    setDestinationId("");
    setErrorMessage(
      null,
    );
  }

  function closeModals() {
    if (isSaving) {
      return;
    }

    setCreateOpen(
      false,
    );
    setSelectedGoal(
      null,
    );
    setAction(null);
    setErrorMessage(
      null,
    );
  }

  async function createGoal(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setIsSaving(
        true,
      );

      setErrorMessage(
        null,
      );

      const target =
        Number(
          targetAmount,
        );

      const saved =
        Number(
          savedAmount,
        );

      if (
        !name.trim()
      ) {
        throw new Error(
          "Give your goal a name.",
        );
      }

      if (
        !Number.isFinite(
          target,
        ) ||
        target <= 0
      ) {
        throw new Error(
          "Enter a valid target.",
        );
      }

      if (
        !Number.isFinite(
          saved,
        ) ||
        saved < 0
      ) {
        throw new Error(
          "Enter a valid saved amount.",
        );
      }

      const response =
        await fetch(
          "/api/goals",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  name.trim(),

                targetAmount:
                  target,

                savedAmount:
                  saved,

                icon:
                  selectedIcon,
              }),
          },
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.message ??
            "Unable to create goal.",
        );
      }

      setCreateOpen(
        false,
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof
          Error
          ? error.message
          : "Unable to create goal.",
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  async function runAction(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !selectedGoal ||
      !action
    ) {
      return;
    }

    try {
      setIsSaving(
        true,
      );

      setErrorMessage(
        null,
      );

      const amount =
        Number(
          actionAmount,
        );

      if (
        !Number.isFinite(
          amount,
        ) ||
        amount <= 0
      ) {
        throw new Error(
          "Enter a valid amount.",
        );
      }

      if (
        action ===
          "move" &&
        !destinationId
      ) {
        throw new Error(
          "Choose a destination goal.",
        );
      }

      const response =
        await fetch(
          "/api/goals/action",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                goalId:
                  selectedGoal.id,

                action,

                amount,

                toGoalId:
                  action ===
                  "move"
                    ? destinationId
                    : undefined,
              }),
          },
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.message ??
            "Unable to update goal.",
        );
      }

      setSelectedGoal(
        null,
      );

      setAction(null);

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof
          Error
          ? error.message
          : "Unable to update goal.",
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  return (
    <>
      <section className="space-y-4">

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
              onClick={
                openCreate
              }
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-peach"
            >
              New goal

              <ChevronRight className="h-3 w-3" />
            </button>

          </div>
        )}

        {variant ===
          "page" &&
          !showHeader && (
          <div className="flex justify-end">

            <button
              type="button"
              onClick={
                openCreate
              }
              className="inline-flex items-center gap-2 rounded-full bg-peach px-4 py-2 text-xs font-bold text-peach-foreground"
            >
              <Plus className="h-3.5 w-3.5" />

              New goal
            </button>

          </div>
        )}

        {variant ===
          "page" && (
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
              across{" "}
              {
                goals.length
              }{" "}
              {goals.length ===
              1
                ? "goal"
                : "goals"}
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

        {goals.length ===
          0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">

            <Target className="mx-auto h-6 w-6 text-peach" />

            <p className="mt-3 text-sm font-bold">
              No goals yet
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Give your money somewhere meaningful to go.
            </p>

          </div>
        )}

        <div
          className={
            variant ===
            "page"
              ? "space-y-2.5"
              : "grid grid-cols-2 gap-3"
          }
        >

          {goals.map(
            (
              goal,
              index,
            ) => {
              const percentage =
                goal.targetAmount >
                0
                  ? Math.min(
                      100,
                      Math.round(
                        (goal.savedAmount /
                          goal.targetAmount) *
                          100,
                      ),
                    )
                  : 0;

              const tone =
                tones[
                  index %
                    tones.length
                ];

              const Icon =
                iconMap[
                  goal.icon
                ] ??
                Target;

              if (
                variant ===
                "page"
              ) {
                return (
                  <button
                    key={
                      goal.id
                    }
                    type="button"
                    onClick={() =>
                      openManage(
                        goal,
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition hover:bg-card/80 ${tone.border}`}
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
                            {
                              goal.name
                            }
                          </p>

                          <p className="text-[10px] text-muted-foreground">
                            {formatMoney(
                              Math.max(
                                0,
                                goal.targetAmount -
                                  goal.savedAmount,
                              ),
                            )}{" "}
                            to go
                          </p>
                        </div>

                        <p
                          className={`text-sm font-bold ${tone.text}`}
                        >
                          {
                            percentage
                          }
                          %
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
                            goal.savedAmount,
                          )}{" "}
                          saved
                        </span>

                        <span>
                          {formatMoney(
                            goal.targetAmount,
                          )}{" "}
                          goal
                        </span>

                      </div>

                    </div>

                  </button>
                );
              }

              return (
                <button
                  key={
                    goal.id
                  }
                  type="button"
                  onClick={() =>
                    openManage(
                      goal,
                    )
                  }
                  className="rounded-2xl border border-border/70 bg-card p-4 text-left transition hover:bg-card/80"
                >

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60">

                    <Icon
                      className={`h-4 w-4 ${tone.text}`}
                    />

                  </div>

                  <p className="mt-3 text-sm font-bold">
                    {
                      goal.name
                    }
                  </p>

                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatMoney(
                      goal.savedAmount,
                    )}
                    {" / "}
                    {formatMoney(
                      goal.targetAmount,
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
                    {
                      percentage
                    }
                    %
                  </p>

                </button>
              );
            },
          )}

        </div>

      </section>

      {/* CREATE MODAL */}
      {createOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-[1.75rem] border border-border bg-card p-5">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-peach">
                  Saving for
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  New goal
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeModals
                }
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            <form
              onSubmit={
                createGoal
              }
              className="mt-5 space-y-4"
            >

              <label className="block space-y-1.5">

                <span className="text-[11px] text-muted-foreground">
                  Goal name
                </span>

                <input
                  value={
                    name
                  }
                  onChange={(
                    event,
                  ) =>
                    setName(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Japan trip"
                  className="w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-peach/60"
                />

              </label>

              <div>

                <p className="text-[11px] text-muted-foreground">
                  Choose an icon
                </p>

                <div className="mt-2 grid grid-cols-5 gap-2">

                  {iconOptions.map(
                    ({
                      key,
                      Icon,
                    }) => (
                      <button
                        key={
                          key
                        }
                        type="button"
                        onClick={() =>
                          setSelectedIcon(
                            key,
                          )
                        }
                        className={`flex h-10 items-center justify-center rounded-xl border transition ${
                          selectedIcon ===
                          key
                            ? "border-peach bg-peach/15 text-peach"
                            : "border-border bg-background/50 text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ),
                  )}

                </div>

              </div>

              <MoneyInput
                label="Target amount"
                value={
                  targetAmount
                }
                onChange={
                  setTargetAmount
                }
              />

              <MoneyInput
                label="Already saved"
                value={
                  savedAmount
                }
                onChange={
                  setSavedAmount
                }
              />

              {errorMessage && (
                <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  {
                    errorMessage
                  }
                </p>
              )}

              <button
                type="submit"
                disabled={
                  isSaving
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-peach px-4 py-3 text-sm font-bold text-peach-foreground disabled:opacity-50"
              >

                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create goal
                  </>
                )}

              </button>

            </form>

          </div>

        </div>
      )}

      {/* MANAGE GOAL */}
      {selectedGoal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-sm rounded-[1.75rem] border border-border bg-card p-5">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-peach">
                  Manage savings
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {
                    selectedGoal.name
                  }
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatMoney(
                    selectedGoal.savedAmount,
                  )}{" "}
                  currently reserved
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeModals
                }
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">

              <ActionButton
                active={
                  action ===
                  "add"
                }
                onClick={() => {
                  setAction(
                    "add",
                  );
                  setErrorMessage(
                    null,
                  );
                }}
                Icon={
                  Plus
                }
                label="Add"
              />

              <ActionButton
                active={
                  action ===
                  "move"
                }
                onClick={() => {
                  setAction(
                    "move",
                  );
                  setErrorMessage(
                    null,
                  );
                }}
                Icon={
                  ArrowRightLeft
                }
                label="Move"
              />

              <ActionButton
                active={
                  action ===
                  "release"
                }
                onClick={() => {
                  setAction(
                    "release",
                  );
                  setErrorMessage(
                    null,
                  );
                }}
                Icon={
                  Undo2
                }
                label="Release"
              />

            </div>

            {!action && (
              <div className="mt-5 rounded-xl border border-border/60 bg-background/40 p-4">

                <WalletCards className="h-5 w-5 text-mint" />

                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Add money to protect it,
                  move it between goals,
                  or release it back to
                  your available spending.
                </p>

              </div>
            )}

            {action && (
              <form
                onSubmit={
                  runAction
                }
                className="mt-5 space-y-4"
              >

                <MoneyInput
                  label={
                    action ===
                    "add"
                      ? "Amount to reserve"
                      : action ===
                        "move"
                      ? "Amount to move"
                      : "Amount to release"
                  }
                  value={
                    actionAmount
                  }
                  onChange={
                    setActionAmount
                  }
                />

                {action ===
                  "move" && (
                  <label className="block space-y-1.5">

                    <span className="text-[11px] text-muted-foreground">
                      Move to
                    </span>

                    <select
                      value={
                        destinationId
                      }
                      onChange={(
                        event,
                      ) =>
                        setDestinationId(
                          event
                            .target
                            .value,
                        )
                      }
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none"
                    >

                      <option value="">
                        Choose goal
                      </option>

                      {goals
                        .filter(
                          (
                            goal,
                          ) =>
                            goal.id !==
                            selectedGoal.id,
                        )
                        .map(
                          (
                            goal,
                          ) => (
                            <option
                              key={
                                goal.id
                              }
                              value={
                                goal.id
                              }
                            >
                              {
                                goal.name
                              }
                            </option>
                          ),
                        )}

                    </select>

                  </label>
                )}

                {action ===
                  "release" && (
                  <div className="rounded-xl border border-warning/20 bg-warning/10 p-3">

                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Released money becomes
                      available for spending
                      again.
                    </p>

                  </div>
                )}

                {errorMessage && (
                  <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                    {
                      errorMessage
                    }
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    isSaving
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-peach px-4 py-3 text-sm font-bold text-peach-foreground disabled:opacity-50"
                >

                  {isSaving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {isSaving
                    ? "Updating..."
                    : action ===
                      "add"
                    ? "Reserve money"
                    : action ===
                      "move"
                    ? "Move money"
                    : "Release to spending"}

                </button>

              </form>
            )}

          </div>

        </div>
      )}

    </>
  );
}

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
}) {
  return (
    <label className="block space-y-1.5">

      <span className="text-[11px] text-muted-foreground">
        {label}
      </span>

      <div className="flex items-center rounded-xl border border-border bg-background/60 px-3 py-2.5 focus-within:border-peach/60">

        <span className="mr-1 text-sm text-muted-foreground">
          MX$
        </span>

        <input
          type="number"
          min="0"
          value={
            value
          }
          onChange={(
            event,
          ) =>
            onChange(
              event.target
                .value,
            )
          }
          className="w-full bg-transparent text-sm font-semibold outline-none"
        />

      </div>

    </label>
  );
}

function ActionButton({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-xl border p-3 text-center transition ${
        active
          ? "border-peach bg-peach/10 text-peach"
          : "border-border bg-background/50 text-muted-foreground"
      }`}
    >
      <Icon className="mx-auto h-4 w-4" />

      <span className="mt-1 block text-[10px] font-bold">
        {label}
      </span>
    </button>
  );
}