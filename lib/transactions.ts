import "server-only";

import { reportPublicError } from "@/lib/error-message";
import type { TransactionRecord, TransactionType } from "@/lib/transactions-shared";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_TRANSACTION_LIMIT = 10;
const MAX_TRANSACTION_LIMIT = 100;

type FinanceTransactionRow = {
  id: string;
  occurred_on: string;
  transaction_type: TransactionType;
  category: string;
  amount: number | string;
  note: string | null;
  created_at: string;
};

function normalizeLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_TRANSACTION_LIMIT;
  }

  return Math.min(MAX_TRANSACTION_LIMIT, Math.max(1, Math.trunc(limit)));
}

function toTransactionRecord(row: FinanceTransactionRow): TransactionRecord {
  return {
    id: row.id,
    date: row.occurred_on,
    type: row.transaction_type,
    category: row.category,
    amount: Number(row.amount),
    note: row.note ?? "",
  };
}

export async function listUserTransactions(limit = DEFAULT_TRANSACTION_LIMIT) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return [] as TransactionRecord[];
  }

  const { data, error } = await supabase
    .from("finance_transactions")
    .select("id, occurred_on, transaction_type, category, amount, note, created_at")
    .eq("user_id", userId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(normalizeLimit(limit));

  if (error) {
    throw new Error(
      reportPublicError(
        "Could not load transactions.",
        error,
        "Could not load transactions."
      )
    );
  }

  return ((data ?? []) as FinanceTransactionRow[]).map(toTransactionRecord);
}
