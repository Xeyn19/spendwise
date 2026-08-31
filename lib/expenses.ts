import "server-only";

import { reportPublicError } from "@/lib/error-message";
import type { ExpenseRecord } from "@/lib/expense-shared";
import { createClient } from "@/lib/supabase/server";

type ExpenseRow = {
  id: string;
  category: string;
  amount: number | string;
  spent_on: string;
  note: string | null;
  created_at: string;
};

function toExpenseRecord(row: ExpenseRow): ExpenseRecord {
  return {
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    date: row.spent_on,
    note: row.note ?? "",
    createdAt: row.created_at,
  };
}

export async function listUserExpenses() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("id, category, amount, spent_on, note, created_at")
    .eq("user_id", userId)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      reportPublicError("Could not load expenses.", error, "Could not load expenses.")
    );
  }

  return ((data ?? []) as ExpenseRow[]).map(toExpenseRecord);
}
