export type SavingsEntryType = "contribution" | "withdrawal";

export type SavingsEntryRecord = {
  id: string;
  goalId: string;
  goalName: string;
  type: SavingsEntryType;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
};

export type SavingsGoalRecord = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  remainingAmount: number;
  createdAt: string;
};

export type SavingsTransaction = {
  id: string;
  date: string;
  type: "Savings";
  category: string;
  amount: number;
  note: string;
};

export function getSavingsEntrySignedAmount(entry: Pick<SavingsEntryRecord, "type" | "amount">) {
  return entry.type === "withdrawal" ? -entry.amount : entry.amount;
}

export function toSavingsTransaction(entry: SavingsEntryRecord): SavingsTransaction {
  return {
    id: `savings-${entry.id}`,
    date: entry.date,
    type: "Savings",
    category: entry.goalName,
    amount: getSavingsEntrySignedAmount(entry),
    note: entry.note || (entry.type === "withdrawal" ? "Savings withdrawal" : "Savings contribution"),
  };
}
