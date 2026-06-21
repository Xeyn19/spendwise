import "server-only";

import { buildReportData } from "@/lib/reports-shared";
import { listUserBudgets } from "@/lib/budgets";
import { listUserExpenses } from "@/lib/expenses";
import { listUserIncomes } from "@/lib/incomes";
import { listUserSavings } from "@/lib/savings";

export async function listUserReports() {
  const [incomes, budgets, expenses, savings] = await Promise.all([
    listUserIncomes(),
    listUserBudgets(),
    listUserExpenses(),
    listUserSavings(),
  ]);

  return buildReportData({
    incomes,
    expenses,
    budgets,
    savingsEntries: savings.entries,
  });
}
