export type TransactionType = "Income" | "Expense" | "Savings";

export type TransactionRecord = {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
};
