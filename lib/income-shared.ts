import type { TransactionRecord } from "@/lib/transactions-shared";

export type IncomeRecord = {
  id: string;
  source: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
};

export type IncomeTransaction = TransactionRecord & {
  type: "Income";
};

export function toIncomeTransaction(income: IncomeRecord): IncomeTransaction {
  return {
    id: `income-${income.id}`,
    date: income.date,
    type: "Income",
    category: income.source,
    amount: income.amount,
    note: income.note,
  };
}
