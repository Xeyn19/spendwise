export type IncomeRecord = {
  id: string;
  source: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
};

export type IncomeTransaction = {
  id: string;
  date: string;
  type: "Income";
  category: string;
  amount: number;
  note: string;
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
