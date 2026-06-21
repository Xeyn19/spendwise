import type { BudgetRecord } from "@/lib/budget-shared";
import type { ExpenseRecord } from "@/lib/expense-shared";
import { normalizeCategoryKey } from "@/lib/expense-shared";
import type { IncomeRecord } from "@/lib/income-shared";
import type { SavingsEntryRecord } from "@/lib/savings-shared";
import { getSavingsEntrySignedAmount } from "@/lib/savings-shared";

export type AnalyticsSummary = {
  avgMonthlyExpense: number;
  highestSpendingCategory: string;
  savingsRate: number;
  budgetEfficiency: number;
};

export type MonthlyAnalyticsPoint = {
  monthKey: string;
  month: string;
  income: number;
  expenses: number;
  savings: number;
  netSavings: number;
};

export type TrendGranularity = "daily" | "weekly" | "monthly";

export type TrendDateRange = {
  startDate?: string;
  endDate?: string;
};

export type ExpenseCategoryAnalytics = {
  name: string;
  value: number;
  color: string;
};

export type BudgetVarianceAnalytics = {
  id: string;
  category: string;
  budgeted: number;
  spent: number;
  variance: number;
  status: "On track" | "Over budget";
};

export type AnalyticsData = {
  summary: AnalyticsSummary;
  monthlyTrend: MonthlyAnalyticsPoint[];
  expenseByCategory: ExpenseCategoryAnalytics[];
  budgetVariance: BudgetVarianceAnalytics[];
  topCategory: ExpenseCategoryAnalytics;
  hasFinancialData: boolean;
};

const categoryColors = ["#16a34a", "#2563eb", "#ef4444", "#a855f7", "#f59e0b", "#06b6d4"];

function getMonthKey(date: string) {
  return date.slice(0, 7);
}

function getDayKey(date: string) {
  return date.slice(0, 10);
}

function getWeekKey(date: string) {
  const value = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  const day = value.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  value.setUTCDate(value.getUTCDate() - daysSinceMonday);

  return value.toISOString().slice(0, 10);
}

function getBucketKey(date: string, granularity: TrendGranularity) {
  if (granularity === "daily") return getDayKey(date);
  if (granularity === "weekly") return getWeekKey(date);
  return getMonthKey(date);
}

function formatDayLabel(dayKey: string) {
  return new Date(`${dayKey}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatWeekLabel(weekKey: string) {
  const start = new Date(`${weekKey}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return `${startLabel}-${endLabel}`;
}

function formatMonthLabel(monthKey: string) {
  return new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function addMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month, 1));

  return next.toISOString().slice(0, 7);
}

function addDayKey(dayKey: string) {
  const next = new Date(`${dayKey}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);

  return next.toISOString().slice(0, 10);
}

function addWeekKey(weekKey: string) {
  const next = new Date(`${weekKey}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 7);

  return next.toISOString().slice(0, 10);
}

function addBucketKey(bucketKey: string, granularity: TrendGranularity) {
  if (granularity === "daily") return addDayKey(bucketKey);
  if (granularity === "weekly") return addWeekKey(bucketKey);
  return addMonthKey(bucketKey);
}

function formatBucketLabel(bucketKey: string, granularity: TrendGranularity) {
  if (granularity === "daily") return formatDayLabel(bucketKey);
  if (granularity === "weekly") return formatWeekLabel(bucketKey);
  return formatMonthLabel(bucketKey);
}

function isValidIsoDate(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function getBucketKeys({
  dates,
  granularity,
  startDate,
  endDate,
}: {
  dates: string[];
  granularity: TrendGranularity;
  startDate?: string;
  endDate?: string;
}) {
  const bucketKeys = dates
    .filter(Boolean)
    .map((date) => getBucketKey(date, granularity))
    .filter((value) => (granularity === "monthly" ? /^\d{4}-\d{2}$/.test(value) : /^\d{4}-\d{2}-\d{2}$/.test(value)))
    .sort();
  const startKey = isValidIsoDate(startDate)
    ? getBucketKey(startDate!, granularity)
    : bucketKeys[0];
  const endKey = isValidIsoDate(endDate)
    ? getBucketKey(endDate!, granularity)
    : bucketKeys[bucketKeys.length - 1];

  if (!startKey || !endKey || startKey > endKey) {
    return [];
  }

  const keys: string[] = [];
  let cursor = startKey;

  while (cursor <= endKey) {
    keys.push(cursor);
    cursor = addBucketKey(cursor, granularity);
  }

  return keys;
}

function isInDateRange(date: string, range: TrendDateRange) {
  const normalizedDate = date.slice(0, 10);

  if (isValidIsoDate(range.startDate) && normalizedDate < range.startDate!) {
    return false;
  }

  if (isValidIsoDate(range.endDate) && normalizedDate > range.endDate!) {
    return false;
  }

  return true;
}

function sumByBucket(rows: Array<{ date: string; amount: number }>, granularity: TrendGranularity) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const bucketKey = getBucketKey(row.date, granularity);
    acc[bucketKey] = (acc[bucketKey] ?? 0) + row.amount;
    return acc;
  }, {});
}

function matchesBudget(expense: ExpenseRecord, budget: BudgetRecord) {
  return (
    normalizeCategoryKey(expense.category) === normalizeCategoryKey(budget.category) &&
    expense.date >= budget.periodStart &&
    expense.date <= budget.periodEnd
  );
}

export function buildTrendData({
  incomes,
  expenses,
  savingsEntries,
  granularity,
  startDate,
  endDate,
}: {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  savingsEntries: SavingsEntryRecord[];
  granularity: TrendGranularity;
} & TrendDateRange): MonthlyAnalyticsPoint[] {
  const range = { startDate, endDate };
  const rangedIncomes = incomes.filter((item) => isInDateRange(item.date, range));
  const rangedExpenses = expenses.filter((item) => isInDateRange(item.date, range));
  const rangedSavingsEntries = savingsEntries.filter((item) => isInDateRange(item.date, range));
  const bucketKeys = getBucketKeys({
    dates: [
      ...rangedIncomes.map((item) => item.date),
      ...rangedExpenses.map((item) => item.date),
      ...rangedSavingsEntries.map((item) => item.date),
      ...(isValidIsoDate(startDate) ? [startDate!] : []),
      ...(isValidIsoDate(endDate) ? [endDate!] : []),
    ],
    granularity,
    startDate,
    endDate,
  });
  const incomeByBucket = sumByBucket(rangedIncomes, granularity);
  const expenseByBucket = sumByBucket(rangedExpenses, granularity);
  const savingsByBucket = sumByBucket(
    rangedSavingsEntries.map((entry) => ({
      date: entry.date,
      amount: getSavingsEntrySignedAmount(entry),
    })),
    granularity
  );

  return bucketKeys.map((bucketKey) => {
    const income = incomeByBucket[bucketKey] ?? 0;
    const expensesForBucket = expenseByBucket[bucketKey] ?? 0;
    const savings = savingsByBucket[bucketKey] ?? 0;

    return {
      monthKey: bucketKey,
      month: formatBucketLabel(bucketKey, granularity),
      income,
      expenses: expensesForBucket,
      savings,
      netSavings: income - expensesForBucket - savings,
    };
  });
}

export function buildAnalyticsData({
  incomes,
  expenses,
  budgets,
  savingsEntries,
}: {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  budgets: BudgetRecord[];
  savingsEntries: SavingsEntryRecord[];
}): AnalyticsData {
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalBudget = budgets.reduce((sum, item) => sum + item.allocatedAmount, 0);
  const totalSavings = savingsEntries.reduce(
    (sum, entry) => sum + getSavingsEntrySignedAmount(entry),
    0
  );

  const expenseByCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: categoryColors[index % categoryColors.length],
    }));

  const topCategory = expenseByCategory[0] ?? {
    name: "None",
    value: 0,
    color: categoryColors[0],
  };

  const monthlyTrend = buildTrendData({
    incomes,
    expenses,
    savingsEntries,
    granularity: "monthly",
  });

  const budgetVariance = budgets.map((budget) => {
    const spent = expenses
      .filter((expense) => matchesBudget(expense, budget))
      .reduce((sum, expense) => sum + expense.amount, 0);
    const variance = budget.allocatedAmount - spent;

    return {
      id: budget.id,
      category: budget.category,
      budgeted: budget.allocatedAmount,
      spent,
      variance,
      status: variance >= 0 ? "On track" : "Over budget",
    } satisfies BudgetVarianceAnalytics;
  });

  const avgMonthlyExpense =
    monthlyTrend.length > 0
      ? Math.round(monthlyTrend.reduce((sum, item) => sum + item.expenses, 0) / monthlyTrend.length)
      : 0;
  const savingsRate = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;
  const budgetEfficiency =
    totalBudget > 0
      ? Math.max(0, Math.round(((totalBudget - totalExpenses) / totalBudget) * 100))
      : 0;

  return {
    summary: {
      avgMonthlyExpense,
      highestSpendingCategory: topCategory.name,
      savingsRate,
      budgetEfficiency,
    },
    monthlyTrend,
    expenseByCategory,
    budgetVariance,
    topCategory,
    hasFinancialData:
      incomes.length > 0 || expenses.length > 0 || budgets.length > 0 || savingsEntries.length > 0,
  };
}

export const emptyAnalyticsData = buildAnalyticsData({
  incomes: [],
  expenses: [],
  budgets: [],
  savingsEntries: [],
});
