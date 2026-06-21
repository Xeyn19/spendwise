import type { BudgetRecord } from "@/lib/budget-shared";
import type { ExpenseRecord } from "@/lib/expense-shared";
import { normalizeCategoryKey } from "@/lib/expense-shared";
import type { IncomeRecord } from "@/lib/income-shared";
import type { SavingsEntryRecord } from "@/lib/savings-shared";
import { getSavingsEntrySignedAmount } from "@/lib/savings-shared";

export type ReportTopCategory = {
  name: string;
  amount: number;
  percent: number;
};

export type ReportBudgetRow = {
  id: string;
  category: string;
  budgeted: number;
  spent: number;
  variance: number;
  status: "On track" | "Over budget";
};

export type MonthlyReport = {
  monthKey: string;
  monthLabel: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsContributions: number;
  savingsWithdrawals: number;
  netSavingsEntries: number;
  topCategories: ReportTopCategory[];
  budgetRows: ReportBudgetRow[];
  budgetComplianceCount: number;
  budgetCount: number;
  budgetCompliancePercentage: number;
  incomeSpentPercentage: number;
  budgetUsedPercentage: number;
  statusMessage: string;
  hasReportableData: boolean;
};

export type ReportMonthOption = {
  monthKey: string;
  label: string;
};

export type ReportData = {
  reports: MonthlyReport[];
  monthOptions: ReportMonthOption[];
  hasReportableData: boolean;
};

type ReportInputs = {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  budgets: BudgetRecord[];
  savingsEntries: SavingsEntryRecord[];
};

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function formatMonthLabel(monthKey: string) {
  return new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getMonthBounds(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = `${monthKey}-01`;
  const endDate = new Date(Date.UTC(year, month, 0));
  const end = endDate.toISOString().slice(0, 10);

  return { start, end };
}

function budgetOverlapsMonth(budget: BudgetRecord, monthStart: string, monthEnd: string) {
  return budget.periodStart <= monthEnd && budget.periodEnd >= monthStart;
}

function expenseMatchesBudgetForMonth(
  expense: ExpenseRecord,
  budget: BudgetRecord,
  monthStart: string,
  monthEnd: string
) {
  return (
    normalizeCategoryKey(expense.category) === normalizeCategoryKey(budget.category) &&
    expense.date >= budget.periodStart &&
    expense.date <= budget.periodEnd &&
    expense.date >= monthStart &&
    expense.date <= monthEnd
  );
}

function pct(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function buildStatusMessage({
  totalIncome,
  totalExpenses,
  netSavings,
  budgetCompliancePercentage,
}: Pick<
  MonthlyReport,
  "totalIncome" | "totalExpenses" | "netSavings" | "budgetCompliancePercentage"
>) {
  if (totalIncome <= 0 && totalExpenses <= 0) {
    return "No income or spending activity was recorded for this month.";
  }

  if (netSavings >= 0 && budgetCompliancePercentage >= 75) {
    return "Healthy month: spending stayed controlled while savings remained positive.";
  }

  if (netSavings >= 0) {
    return "Positive month overall, but review categories that are close to or over budget.";
  }

  return "Spending and savings outflows exceeded income this month. Start with the largest categories.";
}

export function buildReportData({
  incomes,
  expenses,
  budgets,
  savingsEntries,
}: ReportInputs): ReportData {
  const monthKeys = Array.from(
    new Set([
      ...incomes.map((income) => getMonthKey(income.date)),
      ...expenses.map((expense) => getMonthKey(expense.date)),
      ...savingsEntries.map((entry) => getMonthKey(entry.date)),
      ...budgets.map((budget) => getMonthKey(budget.periodStart)),
    ])
  )
    .filter((monthKey) => /^\d{4}-\d{2}$/.test(monthKey))
    .sort();

  const reports = monthKeys.map((monthKey): MonthlyReport => {
    const { start, end } = getMonthBounds(monthKey);
    const monthlyIncomes = incomes.filter((income) => getMonthKey(income.date) === monthKey);
    const monthlyExpenses = expenses.filter((expense) => getMonthKey(expense.date) === monthKey);
    const monthlySavingsEntries = savingsEntries.filter(
      (entry) => getMonthKey(entry.date) === monthKey
    );
    const monthlyBudgets = budgets.filter((budget) => budgetOverlapsMonth(budget, start, end));

    const totalIncome = monthlyIncomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const savingsContributions = monthlySavingsEntries
      .filter((entry) => entry.type === "contribution")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const savingsWithdrawals = monthlySavingsEntries
      .filter((entry) => entry.type === "withdrawal")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const netSavingsEntries = monthlySavingsEntries.reduce(
      (sum, entry) => sum + getSavingsEntrySignedAmount(entry),
      0
    );
    const netSavings = totalIncome - totalExpenses - netSavingsEntries;

    const topCategories = Object.entries(
      monthlyExpenses.reduce<Record<string, number>>((acc, expense) => {
        acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: pct(amount, totalExpenses),
      }));

    const budgetRows = monthlyBudgets.map((budget) => {
      const spent = monthlyExpenses
        .filter((expense) => expenseMatchesBudgetForMonth(expense, budget, start, end))
        .reduce((sum, expense) => sum + expense.amount, 0);
      const variance = budget.allocatedAmount - spent;

      return {
        id: budget.id,
        category: budget.category,
        budgeted: budget.allocatedAmount,
        spent,
        variance,
        status: variance >= 0 ? "On track" : "Over budget",
      } satisfies ReportBudgetRow;
    });

    const budgetComplianceCount = budgetRows.filter((budget) => budget.variance >= 0).length;
    const budgetCount = budgetRows.length;
    const totalBudgeted = budgetRows.reduce((sum, budget) => sum + budget.budgeted, 0);
    const budgetCompliancePercentage = pct(budgetComplianceCount, budgetCount);
    const incomeSpentPercentage = pct(totalExpenses, totalIncome);
    const budgetUsedPercentage = pct(totalExpenses, totalBudgeted);
    const hasReportableData =
      monthlyIncomes.length > 0 ||
      monthlyExpenses.length > 0 ||
      monthlySavingsEntries.length > 0 ||
      monthlyBudgets.length > 0;

    return {
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      totalIncome,
      totalExpenses,
      netSavings,
      savingsContributions,
      savingsWithdrawals,
      netSavingsEntries,
      topCategories,
      budgetRows,
      budgetComplianceCount,
      budgetCount,
      budgetCompliancePercentage,
      incomeSpentPercentage,
      budgetUsedPercentage,
      statusMessage: buildStatusMessage({
        totalIncome,
        totalExpenses,
        netSavings,
        budgetCompliancePercentage,
      }),
      hasReportableData,
    };
  });

  return {
    reports,
    monthOptions: reports.map((report) => ({
      monthKey: report.monthKey,
      label: report.monthLabel,
    })),
    hasReportableData: reports.some((report) => report.hasReportableData),
  };
}

export const emptyReportData = buildReportData({
  incomes: [],
  expenses: [],
  budgets: [],
  savingsEntries: [],
});
