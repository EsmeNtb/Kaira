import "server-only";

import {
  supabaseServer,
} from "@/lib/supabase/server";

export type RecurringControlMode =
  | "auto-pay"
  | "ask-me"
  | "watch"
  | "cancel";

export type RecurringControlMap =
  Record<
    string,
    RecurringControlMode
  >;

export async function getRecurringControls(
  accountId: string,
): Promise<RecurringControlMap> {
  const {
    data,
    error,
  } =
    await supabaseServer
      .from(
        "recurring_controls",
      )
      .select(
        "merchant, control_mode",
      )
      .eq(
        "account_id",
        accountId,
      );

  if (error) {
    throw new Error(
      `Unable to load recurring controls: ${error.message}`,
    );
  }

  const controls:
    RecurringControlMap =
    {};

  for (
    const row of data ?? []
  ) {
    controls[
      row.merchant
    ] =
      row.control_mode as RecurringControlMode;
  }

  return controls;
}