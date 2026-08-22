import "server-only";

import { supabaseServer } from "@/lib/supabase/server";

import type { Transaction } from "@/lib/types/finance";

export async function getTransactions(
  accountId: string,
): Promise<Transaction[]> {
  const { data, error } =
    await supabaseServer
      .from("transactions")
      .select(`
        id,
        raw_merchant,
        canonical_merchant,
        amount,
        transaction_date,
        type,
        category
      `)
      .eq("account_id", accountId)
      .order(
        "transaction_date",
        {
          ascending: true,
        },
      );

  if (error) {
    throw new Error(
      `Unable to load transactions: ${error.message}`,
    );
  }

  return data.map(
    (transaction) => ({
      id: transaction.id,

      merchant:
        transaction.raw_merchant,

      amount:
        Number(transaction.amount),

      date:
        transaction.transaction_date,

      type:
        transaction.type as
          | "income"
          | "expense",

      category:
        transaction.category ??
        undefined,
    }),
  );
}