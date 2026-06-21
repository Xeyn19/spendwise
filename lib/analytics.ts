import "server-only";

import { buildAnalyticsData } from "@/lib/analytics-shared";
import { listUserBudgets } from "@/lib/budgets";
import { listUserExpenses } from "@/lib/expenses";
import { listUserIncomes } from "@/lib/incomes";
import { listUserSavings } from "@/lib/savings";

export async function listUserAnalytics() {
  const [incomes, budgets, expenses, savings] = await Promise.all([
    listUserIncomes(),
    listUserBudgets(),
    listUserExpenses(),
    listUserSavings(),
  ]);

  return buildAnalyticsData({
    incomes,
    expenses,
    budgets,
    savingsEntries: savings.entries,
  });
}
