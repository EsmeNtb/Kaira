import "server-only";

import { supabaseServer } from "@/lib/supabase/server";

export interface Account {
  id: string;
  name: string;
  ownerName: string;
  currency: string;
  balance: number;
  safetyBuffer: number;
}

export async function getAccount(
  accountId: string,
): Promise<Account> {
  const { data, error } =
    await supabaseServer
      .from("accounts")
      .select(`
        id,
        name,
        owner_name,
        currency,
        balance,
        safety_buffer
      `)
      .eq("id", accountId)
      .single();

  if (error) {
    throw new Error(
      `Unable to load account: ${error.message}`,
    );
  }

  return {
    id: data.id,
    name: data.name,
    ownerName: data.owner_name ?? "Kaira User",
    currency: data.currency,
    balance: Number(data.balance),
    safetyBuffer:
      Number(data.safety_buffer),
  };
}