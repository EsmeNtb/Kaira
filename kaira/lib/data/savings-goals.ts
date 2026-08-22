import "server-only";

import {
  supabaseServer,
} from "@/lib/supabase/server";

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  icon: string;
}

export async function getSavingsGoals(
  accountId: string,
): Promise<SavingsGoal[]> {
  const {
    data,
    error,
  } =
    await supabaseServer
      .from(
        "savings_goals",
      )
      .select(`
        id,
        name,
        target_amount,
        saved_amount,
        icon
      `)
      .eq(
        "account_id",
        accountId,
      )
      .order(
        "created_at",
        {
          ascending: true,
        },
      );

  if (error) {
    throw new Error(
      `Unable to load savings goals: ${error.message}`,
    );
  }

  return (
    data ?? []
  ).map(
    (goal) => ({
      id:
        goal.id,

      name:
        goal.name,

      targetAmount:
        Number(
          goal.target_amount,
        ),

      savedAmount:
        Number(
          goal.saved_amount,
        ),

      icon:
        goal.icon ??
        "target",
    }),
  );
}