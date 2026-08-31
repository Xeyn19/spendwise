import "server-only";

import { reportPublicError } from "@/lib/error-message";
import type { BudgetRecord } from "@/lib/budget-shared";
import { createClient } from "@/lib/supabase/server";

type BudgetRow = {
  id: string;
  category: string;
  icon: string;
  allocated_amount: number | string;
  period_start: string;
  period_end: string;
  created_at: string;
};

function toBudgetRecord(row: BudgetRow): BudgetRecord {
  return {
    id: row.id,
    category: row.category,
    icon: row.icon,
    allocatedAmount: Number(row.allocated_amount),
    periodStart: row.period_start,
    periodEnd: row.period_end,
    createdAt: row.created_at,
  };
}

export async function listUserBudgets() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("budgets")
    .select("id, category, icon, allocated_amount, period_start, period_end, created_at")
    .eq("user_id", userId)
    .order("period_start", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      reportPublicError("Could not load budgets.", error, "Could not load budgets.")
    );
  }

  return ((data ?? []) as BudgetRow[]).map(toBudgetRecord);
}
