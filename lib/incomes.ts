import "server-only";

import { reportPublicError } from "@/lib/error-message";
import type { IncomeRecord } from "@/lib/income-shared";
import { createClient } from "@/lib/supabase/server";

type IncomeRow = {
  id: string;
  source: string;
  amount: number | string;
  received_on: string;
  note: string | null;
  created_at: string;
};

function toIncomeRecord(row: IncomeRow): IncomeRecord {
  return {
    id: row.id,
    source: row.source,
    amount: Number(row.amount),
    date: row.received_on,
    note: row.note ?? "",
    createdAt: row.created_at,
  };
}

export async function listUserIncomes() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("incomes")
    .select("id, source, amount, received_on, note, created_at")
    .eq("user_id", userId)
    .order("received_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      reportPublicError("Could not load incomes.", error, "Could not load incomes.")
    );
  }

  return ((data ?? []) as IncomeRow[]).map(toIncomeRecord);
}
