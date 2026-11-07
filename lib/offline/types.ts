import type { BudgetRecord } from "@/lib/budget-shared";
import type { ExpenseRecord } from "@/lib/expense-shared";
import type { IncomeRecord } from "@/lib/income-shared";
import type { SavingsEntryRecord, SavingsEntryType, SavingsGoalRecord } from "@/lib/savings-shared";
import type { TransactionRecord } from "@/lib/transactions-shared";

export type DashboardSnapshot = {
  userId: string;
  savedAt: string;
  incomes: IncomeRecord[];
  budgets: BudgetRecord[];
  expenses: ExpenseRecord[];
  savingsGoals: SavingsGoalRecord[];
  savingsEntries: SavingsEntryRecord[];
  transactions: TransactionRecord[];
};

type MutationBase = {
  id: string;
  userId: string;
  createdAt: string;
};

export type OfflineMutation =
  | (MutationBase & {
      type: "create-income";
      payload: IncomeRecord;
    })
  | (MutationBase & {
      type: "delete-income";
      payload: { id: string };
    })
  | (MutationBase & {
      type: "create-expense";
      payload: ExpenseRecord;
    })
  | (MutationBase & {
      type: "delete-expense";
      payload: { id: string };
    })
  | (MutationBase & {
      type: "create-budget" | "update-budget";
      payload: BudgetRecord;
    })
  | (MutationBase & {
      type: "delete-budget";
      payload: { id: string };
    })
  | (MutationBase & {
      type: "create-savings-goal";
      payload: {
        goal: SavingsGoalRecord;
        initialEntry?: SavingsEntryRecord;
      };
    })
  | (MutationBase & {
      type: "delete-savings-goal";
      payload: { id: string };
    })
  | (MutationBase & {
      type: "create-savings-entry";
      payload: SavingsEntryRecord & { type: SavingsEntryType };
    });

export function createMutation<T extends OfflineMutation["type"]>(
  userId: string,
  type: T,
  payload: Extract<OfflineMutation, { type: T }>["payload"]
) {
  return {
    id: crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
    type,
    payload,
  } as Extract<OfflineMutation, { type: T }>;
}
