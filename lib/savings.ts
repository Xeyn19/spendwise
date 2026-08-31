import "server-only";

import { reportPublicError } from "@/lib/error-message";
import type { SavingsEntryRecord, SavingsEntryType, SavingsGoalRecord } from "@/lib/savings-shared";
import { getSavingsEntrySignedAmount } from "@/lib/savings-shared";
import { createClient } from "@/lib/supabase/server";

type SavingsGoalRow = {
  id: string;
  name: string;
  target_amount: number | string;
  created_at: string;
};

type SavingsEntryRow = {
  id: string;
  goal_id: string;
  type: SavingsEntryType;
  amount: number | string;
  entry_date: string;
  note: string | null;
  created_at: string;
  savings_goals?: {
    name?: string | null;
  } | null;
};

function toSavingsEntryRecord(row: SavingsEntryRow, fallbackGoalName = "Savings") {
  return {
    id: row.id,
    goalId: row.goal_id,
    goalName: row.savings_goals?.name ?? fallbackGoalName,
    type: row.type,
    amount: Number(row.amount),
    date: row.entry_date,
    note: row.note ?? "",
    createdAt: row.created_at,
  } satisfies SavingsEntryRecord;
}

export async function listUserSavings() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { goals: [] as SavingsGoalRecord[], entries: [] as SavingsEntryRecord[] };
  }

  const { data: goalRows, error: goalsError } = await supabase
    .from("savings_goals")
    .select("id, name, target_amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (goalsError) {
    throw new Error(
      reportPublicError(
        "Could not load savings goals.",
        goalsError,
        "Could not load savings goals."
      )
    );
  }

  const { data: entryRows, error: entriesError } = await supabase
    .from("savings_entries")
    .select("id, goal_id, type, amount, entry_date, note, created_at, savings_goals(name)")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (entriesError) {
    throw new Error(
      reportPublicError(
        "Could not load savings entries.",
        entriesError,
        "Could not load savings entries."
      )
    );
  }

  const goals = ((goalRows ?? []) as SavingsGoalRow[]).map((goal) => {
    const goalEntries = ((entryRows ?? []) as SavingsEntryRow[])
      .filter((entry) => entry.goal_id === goal.id)
      .map((entry) => toSavingsEntryRecord(entry, goal.name));
    const savedAmount = goalEntries.reduce(
      (sum, entry) => sum + getSavingsEntrySignedAmount(entry),
      0
    );
    const targetAmount = Number(goal.target_amount);

    return {
      id: goal.id,
      name: goal.name,
      targetAmount,
      savedAmount,
      remainingAmount: Math.max(0, targetAmount - savedAmount),
      createdAt: goal.created_at,
    } satisfies SavingsGoalRecord;
  });

  const entries = ((entryRows ?? []) as SavingsEntryRow[]).map((entry) =>
    toSavingsEntryRecord(
      entry,
      goals.find((goal) => goal.id === entry.goal_id)?.name
    )
  );

  return { goals, entries };
}
