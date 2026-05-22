export type ExpenseRecord = {
  id: string;
  category: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
};

export type ExpenseTransaction = {
  id: string;
  date: string;
  type: "Expense";
  category: string;
  amount: number;
  note: string;
};

export function normalizeCategoryKey(value: string) {
  return value.trim().toLowerCase();
}

export function toExpenseTransaction(expense: ExpenseRecord): ExpenseTransaction {
  return {
    id: `expense-${expense.id}`,
    date: expense.date,
    type: "Expense",
    category: expense.category,
    amount: expense.amount,
    note: expense.note,
  };
}
