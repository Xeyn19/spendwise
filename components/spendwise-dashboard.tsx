"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart2,
  Bell,
  CalendarDays,
  ChevronDown,
  Edit2,
  FileText,
  Landmark,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  PiggyBank,
  Plus,
  Receipt,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  createBudgetAction,
  createExpenseAction,
  createIncomeAction,
  createSavingsEntryAction,
  createSavingsGoalAction,
  deleteBudgetAction,
  deleteExpenseAction,
  deleteIncomeAction,
  deleteSavingsGoalAction,
  updateBudgetAction,
} from "@/app/dashboard/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AnalyticsData, TrendGranularity } from "@/lib/analytics-shared";
import { buildAnalyticsData, buildTrendData } from "@/lib/analytics-shared";
import type { BudgetRecord } from "@/lib/budget-shared";
import type { ExpenseRecord, ExpenseTransaction } from "@/lib/expense-shared";
import { normalizeCategoryKey, toExpenseTransaction } from "@/lib/expense-shared";
import type { IncomeRecord, IncomeTransaction } from "@/lib/income-shared";
import { toIncomeTransaction } from "@/lib/income-shared";
import type { MonthlyReport, ReportData } from "@/lib/reports-shared";
import { buildReportData } from "@/lib/reports-shared";
import type { SavingsEntryRecord, SavingsTransaction, SavingsGoalRecord } from "@/lib/savings-shared";
import { toSavingsTransaction } from "@/lib/savings-shared";

type ActivePage =
  | "Dashboard"
  | "Income"
  | "Budgets"
  | "Expenses"
  | "Savings"
  | "Analytics"
  | "Reports"
  | "Settings";

type Income = IncomeRecord;

type StoredBudget = BudgetRecord;

type Budget = StoredBudget & {
  allocated: number;
  spent: number;
  remaining: number;
};

type Expense = ExpenseRecord;

type DerivedExpense = Expense & {
  matchedBudgetId: string | null;
  isBudgeted: boolean;
};

type SavingsGoal = SavingsGoalRecord;

type SavingsEntry = SavingsEntryRecord;

type Transaction = {
  id: string;
  date: string;
  type: "Income" | "Expense" | "Savings";
  category: string;
  amount: number;
  note: string;
};

type ModalType = "income" | "budget" | "expense" | "savings" | "contribution" | "report" | null;

type TrendFilterMode = TrendGranularity | "custom";

type UserProfile = {
  name: string;
  email: string;
};

const navItems: Array<{ page: ActivePage; icon: React.ElementType }> = [
  { page: "Dashboard", icon: LayoutDashboard },
  { page: "Income", icon: TrendingUp },
  { page: "Budgets", icon: Wallet },
  { page: "Expenses", icon: Receipt },
  { page: "Savings", icon: PiggyBank },
  { page: "Analytics", icon: BarChart2 },
  { page: "Reports", icon: FileText },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const initialBudgets: Array<{
  id: number;
  category: string;
  icon: string;
  allocated: number;
  spent: number;
}> = [
  { id: 1, category: "Food", icon: "🍽️", allocated: 5000, spent: 2000 },
  { id: 2, category: "Transport", icon: "🚗", allocated: 3000, spent: 800 },
  { id: 3, category: "Shopping", icon: "🛍️", allocated: 4000, spent: 1500 },
  { id: 4, category: "Utilities", icon: "💡", allocated: 2500, spent: 1200 },
];

const iconOptions = ["🍽️", "🚗", "🛍️", "💡", "🏠"];

function peso(amount: number) {
  return amount < 0
    ? `-₱${Math.abs(amount).toLocaleString()}`
    : `₱${amount.toLocaleString()}`;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function sortIncomes(rows: Income[]) {
  return [...rows].sort((a, b) => {
    const dateOrder = b.date.localeCompare(a.date);
    return dateOrder !== 0 ? dateOrder : b.createdAt.localeCompare(a.createdAt);
  });
}

function sortBudgetRecords(rows: StoredBudget[]) {
  return [...rows].sort((a, b) => {
    const dateOrder = b.periodStart.localeCompare(a.periodStart);
    return dateOrder !== 0 ? dateOrder : b.createdAt.localeCompare(a.createdAt);
  });
}

function sortExpenses(rows: Expense[]) {
  return [...rows].sort((a, b) => {
    const dateOrder = b.date.localeCompare(a.date);
    return dateOrder !== 0 ? dateOrder : b.createdAt.localeCompare(a.createdAt);
  });
}

function sortSavingsGoals(rows: SavingsGoal[]) {
  return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function sortSavingsEntries(rows: SavingsEntry[]) {
  return [...rows].sort((a, b) => {
    const dateOrder = b.date.localeCompare(a.date);
    return dateOrder !== 0 ? dateOrder : b.createdAt.localeCompare(a.createdAt);
  });
}

function matchesBudget(expense: Expense, budget: StoredBudget) {
  return (
    normalizeCategoryKey(expense.category) === normalizeCategoryKey(budget.category) &&
    expense.date >= budget.periodStart &&
    expense.date <= budget.periodEnd
  );
}

function formatBudgetDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pct(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function barTone(percent: number) {
  if (percent >= 100) return "bg-red-500";
  if (percent >= 75) return "bg-amber-500";
  return "bg-emerald-600";
}

function amountClass(transaction: Transaction) {
  if (transaction.type === "Income") return "text-emerald-700";
  if (transaction.type === "Savings" && transaction.amount < 0) return "text-red-600";
  if (transaction.type === "Savings") return "text-blue-700";
  return "text-red-600";
}

function AppButton({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
}) {
  return (
    <button
      className={cx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground shadow-[0_10px_30px_-12px_color-mix(in_srgb,var(--primary)_70%,transparent)] hover:bg-primary/90",
        variant === "outline" && "border border-border bg-background/60 text-foreground hover:bg-accent hover:text-accent-foreground",
        variant === "ghost" && "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cx(
        "rounded-xl border border-border/70 bg-card/88 p-5 text-card-foreground shadow-[0_24px_80px_-48px_rgba(17,24,39,0.24)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_28px_90px_-52px_rgba(17,24,39,0.32)] dark:border-white/8 dark:bg-white/5 dark:shadow-none",
        className
      )}
    >
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
      {error ? <span className="block text-sm font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { invalid, className, ...rest } = props;

  return (
    <input
      className={cx(
        "h-11 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/25",
        invalid && "border-red-300 dark:border-red-500/70",
        className
      )}
      {...rest}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  const { invalid, className, ...rest } = props;

  return (
    <select
      className={cx(
        "h-11 w-full rounded-xl border border-input bg-background/70 px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/25",
        invalid && "border-red-300 dark:border-red-500/70",
        className
      )}
      {...rest}
    />
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "red" | "blue" | "amber" | "slate" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        tone === "green" && "bg-primary/10 text-primary dark:text-emerald-100",
        tone === "red" && "bg-red-500/10 text-red-700 dark:text-red-200",
        tone === "blue" && "bg-blue-500/10 text-blue-700 dark:text-blue-200",
        tone === "amber" && "bg-amber-500/10 text-amber-700 dark:text-amber-200",
        tone === "slate" && "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

function ProgressBar({ value, tone }: { value: number; tone?: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
      <div
        className={cx("h-full rounded-full transition-all", tone ?? "bg-emerald-600")}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/55 px-6 text-center dark:bg-white/4">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary dark:text-emerald-100">
        <Receipt className="size-6" />
      </div>
      <p className="font-semibold text-foreground">{message}</p>
      <p className="mt-1 text-sm text-muted-foreground">Use a quick action to add your first record.</p>
    </div>
  );
}

export function SpendWiseDashboard({
  user,
  initialIncomes,
  initialBudgets,
  initialExpenses,
  initialSavingsGoals,
  initialSavingsEntries,
  initialTransactions,
  initialAnalyticsData,
  initialReportData,
  todayIso,
}: {
  user: UserProfile;
  initialIncomes: Income[];
  initialBudgets: StoredBudget[];
  initialExpenses: Expense[];
  initialSavingsGoals: SavingsGoal[];
  initialSavingsEntries: SavingsEntry[];
  initialTransactions: Array<IncomeTransaction | ExpenseTransaction | SavingsTransaction>;
  initialAnalyticsData: AnalyticsData;
  initialReportData: ReportData;
  todayIso: string;
}) {
  const initials = React.useMemo(
    () =>
      user.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "SW",
    [user.name]
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activePage, setActivePage] = React.useState<ActivePage>("Dashboard");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [modal, setModal] = React.useState<ModalType>(null);
  const [editingBudget, setEditingBudget] = React.useState<Budget | null>(null);
  const [contributionGoal, setContributionGoal] = React.useState<SavingsGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [expenseFilter, setExpenseFilter] = React.useState("All");
  const [selectedMonth, setSelectedMonth] = React.useState("");
  const [trendFilterMode, setTrendFilterMode] = React.useState<TrendFilterMode>("monthly");
  const [trendCustomStart, setTrendCustomStart] = React.useState("");
  const [trendCustomEnd, setTrendCustomEnd] = React.useState("");
  const [profileName, setProfileName] = React.useState(user.name);
  const [profileEmail, setProfileEmail] = React.useState(user.email);
  const [compactCurrency, setCompactCurrency] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [isMutatingIncome, startIncomeMutation] = React.useTransition();
  const [isMutatingBudget, startBudgetMutation] = React.useTransition();
  const [isMutatingExpense, startExpenseMutation] = React.useTransition();
  const [isMutatingSavings, startSavingsMutation] = React.useTransition();

  const [incomes, setIncomes] = React.useState<Income[]>(initialIncomes);
  const [budgetRecords, setBudgetRecords] = React.useState<StoredBudget[]>(initialBudgets);
  const [expenses, setExpenses] = React.useState<Expense[]>(sortExpenses(initialExpenses));
  const [savingsGoals, setSavingsGoals] = React.useState<SavingsGoal[]>(initialSavingsGoals);
  const [savingsEntries, setSavingsEntries] = React.useState<SavingsEntry[]>(initialSavingsEntries);
  const [transactions, setTransactions] = React.useState<Transaction[]>(() => [...initialTransactions]);

  const [forms, setForms] = React.useState({
    source: "",
    incomeAmount: "",
    incomeDate: todayIso,
    incomeNote: "",
    budgetCategory: "",
    budgetAmount: "",
    budgetIcon: iconOptions[0],
    budgetStartDate: todayIso,
    budgetEndDate: todayIso,
    expenseCategory: "",
    expenseAmount: "",
    expenseDate: todayIso,
    expenseNote: "",
    goalName: "",
    targetAmount: "",
    initialSaved: "",
    savingsEntryType: "contribution",
    savingsEntryDate: todayIso,
    savingsEntryNote: "",
    contributionAmount: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const loginToastShownRef = React.useRef(false);

  React.useEffect(() => {
    if (searchParams.get("login") !== "success") {
      return;
    }

    if (loginToastShownRef.current) {
      return;
    }

    loginToastShownRef.current = true;
    toast.success("You have signed in successfully.");
    router.replace("/dashboard", { scroll: false });
  }, [router, searchParams]);

  const currentDate = React.useMemo(
    () =>
      new Date(`${todayIso}T00:00:00`).toLocaleDateString("en-PH", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [todayIso]
  );

  const derivedExpenses = React.useMemo<DerivedExpense[]>(
    () =>
      sortExpenses(expenses).map((expense) => {
        const matchedBudget = budgetRecords.find((budget) => matchesBudget(expense, budget));

        return {
          ...expense,
          matchedBudgetId: matchedBudget?.id ?? null,
          isBudgeted: Boolean(matchedBudget),
        };
      }),
    [budgetRecords, expenses]
  );

  const budgets = React.useMemo<Budget[]>(
    () =>
      sortBudgetRecords(budgetRecords).map((budget) => {
        const spent = derivedExpenses
          .filter((expense) => expense.matchedBudgetId === budget.id)
          .reduce((sum, expense) => sum + expense.amount, 0);

        return {
          ...budget,
          allocated: budget.allocatedAmount,
          spent,
          remaining: budget.allocatedAmount - spent,
        };
      }),
    [budgetRecords, derivedExpenses]
  );

  const totals = React.useMemo(() => {
    const income = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalBudget = budgets.reduce((sum, item) => sum + item.allocated, 0);
    const totalExpenses = derivedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const budgetedExpenses = budgets.reduce((sum, item) => sum + item.spent, 0);
    const totalSavings = savingsGoals.reduce((sum, item) => sum + item.savedAmount, 0);
    const remainingBalance = income - totalExpenses - totalSavings;
    const budgetRemaining = totalBudget - budgetedExpenses;
    return { income, totalBudget, totalExpenses, totalSavings, remainingBalance, budgetRemaining };
  }, [budgets, derivedExpenses, incomes, savingsGoals]);

  const analyticsData = React.useMemo(() => {
    const nextAnalyticsData = buildAnalyticsData({
      incomes,
      expenses: derivedExpenses,
      budgets: budgetRecords,
      savingsEntries,
    });

    if (nextAnalyticsData.hasFinancialData || !initialAnalyticsData.hasFinancialData) {
      return nextAnalyticsData;
    }

    return initialAnalyticsData;
  }, [budgetRecords, derivedExpenses, incomes, initialAnalyticsData, savingsEntries]);

  const reportData = React.useMemo(() => {
    const nextReportData = buildReportData({
      incomes,
      expenses: derivedExpenses,
      budgets: budgetRecords,
      savingsEntries,
    });

    if (nextReportData.hasReportableData || !initialReportData.hasReportableData) {
      return nextReportData;
    }

    return initialReportData;
  }, [budgetRecords, derivedExpenses, incomes, initialReportData, savingsEntries]);

  const trendData = React.useMemo(() => {
    if (trendFilterMode === "monthly") {
      return analyticsData.monthlyTrend;
    }

    return buildTrendData({
      incomes,
      expenses: derivedExpenses,
      savingsEntries,
      granularity: trendFilterMode === "custom" ? "daily" : trendFilterMode,
      startDate: trendFilterMode === "custom" ? trendCustomStart : undefined,
      endDate: trendFilterMode === "custom" ? trendCustomEnd : undefined,
    });
  }, [
    analyticsData.monthlyTrend,
    derivedExpenses,
    incomes,
    savingsEntries,
    trendCustomEnd,
    trendCustomStart,
    trendFilterMode,
  ]);

  const trendSubtitle =
    trendFilterMode === "custom"
      ? "Custom date range grouped daily"
      : `${trendFilterMode.charAt(0).toUpperCase()}${trendFilterMode.slice(1)} performance`;

  const recentTransactions = React.useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [transactions]
  );

  const recentSavingsEntries = React.useMemo(
    () => sortSavingsEntries(savingsEntries).slice(0, 5),
    [savingsEntries]
  );

  const categories = React.useMemo(
    () => Array.from(new Set([...budgetRecords.map((budget) => budget.category), ...derivedExpenses.map((expense) => expense.category)])).sort(),
    [budgetRecords, derivedExpenses]
  );

  const filteredExpenses = React.useMemo(
    () => (expenseFilter === "All" ? derivedExpenses : derivedExpenses.filter((expense) => expense.category === expenseFilter)),
    [derivedExpenses, expenseFilter]
  );

  const selectedReport = React.useMemo(
    () =>
      reportData.reports.find((report) => report.monthKey === selectedMonth) ??
      reportData.reports.at(-1) ??
      null,
    [reportData.reports, selectedMonth]
  );

  const exportReportPdf = React.useCallback(async (report: MonthlyReport | null) => {
    if (!report) {
      toast.error("No report is available to export.");
      return;
    }

    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const logoDataUrl = await fetch("/spendwise-logo.png")
      .then(async (response) => {
        if (!response.ok) return null;

        const blob = await response.blob();

        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      })
      .catch(() => null);
    const doc = new jsPDF();
    const pdf = doc as typeof doc & { lastAutoTable?: { finalY: number } };
    const generatedAt = new Date().toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    type PdfColor = [number, number, number];
    const brand = {
      ink: [13, 24, 34] as PdfColor,
      primary: [23, 178, 106] as PdfColor,
      primaryDark: [4, 17, 11] as PdfColor,
      muted: [95, 115, 133] as PdfColor,
      panel: [244, 248, 247] as PdfColor,
      border: [219, 232, 229] as PdfColor,
      blue: [37, 99, 235] as PdfColor,
      danger: [239, 68, 68] as PdfColor,
    };

    pdf.setFillColor(...brand.primaryDark);
    pdf.rect(0, 0, pageWidth, 45, "F");
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, "PNG", 14, 10, 12, 12);
    } else {
      pdf.setFillColor(...brand.primary);
      pdf.roundedRect(14, 12, 9, 9, 2, 2, "F");
    }
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("SpendWise", 31, 19);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Monthly finance report", 31, 26);
    pdf.setTextColor(196, 238, 217);
    pdf.text(report.monthLabel, 14, 36);
    pdf.text(`Generated ${generatedAt}`, pageWidth - 14, 36, { align: "right" });

    pdf.setTextColor(...brand.ink);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("Financial Snapshot", 14, 58);
    pdf.setDrawColor(...brand.border);
    pdf.line(14, 62, pageWidth - 14, 62);

    const drawMetricCard = (
      label: string,
      value: string,
      x: number,
      y: number,
      color: PdfColor = brand.ink
    ) => {
      pdf.setFillColor(...brand.panel);
      pdf.setDrawColor(...brand.border);
      pdf.roundedRect(x, y, 57, 26, 3, 3, "FD");
      pdf.setTextColor(...brand.muted);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text(label.toUpperCase(), x + 4, y + 8);
      pdf.setTextColor(...color);
      pdf.setFontSize(13);
      pdf.text(value, x + 4, y + 19, { maxWidth: 49 });
    };

    drawMetricCard("Income", peso(report.totalIncome), 14, 69, brand.primary);
    drawMetricCard("Expenses", peso(report.totalExpenses), 76.5, 69, brand.danger);
    drawMetricCard(
      "Net Savings",
      peso(report.netSavings),
      139,
      69,
      report.netSavings >= 0 ? brand.blue : brand.danger
    );

    pdf.setFillColor(232, 248, 239);
    pdf.setDrawColor(185, 229, 204);
    pdf.roundedRect(14, 103, pageWidth - 28, 22, 3, 3, "FD");
    pdf.setTextColor(...brand.primaryDark);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Status", 20, 112);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(pdf.splitTextToSize(report.statusMessage, 164), 20, 119);

    autoTable(pdf, {
      startY: 136,
      head: [["Metric", "Amount"]],
      body: [
        ["Savings Contributions", peso(report.savingsContributions)],
        ["Savings Withdrawals", peso(report.savingsWithdrawals)],
        ["Net Savings Entries", peso(report.netSavingsEntries)],
        ["Income Spent", `${report.incomeSpentPercentage}%`],
        ["Budget Used", `${report.budgetUsedPercentage}%`],
        ["Budget Compliance", `${report.budgetComplianceCount}/${report.budgetCount} (${report.budgetCompliancePercentage}%)`],
      ],
      theme: "plain",
      margin: { left: 14, right: 14 },
      headStyles: {
        fillColor: brand.primary,
        textColor: brand.primaryDark,
        fontStyle: "bold",
      },
      bodyStyles: {
        textColor: brand.ink,
        lineColor: brand.border,
        lineWidth: 0.2,
      },
      alternateRowStyles: { fillColor: brand.panel },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        1: { halign: "right", fontStyle: "bold" },
      },
    });

    autoTable(pdf, {
      startY: (pdf.lastAutoTable?.finalY ?? 136) + 10,
      head: [["Top Category", "Amount", "Share"]],
      body:
        report.topCategories.length > 0
          ? report.topCategories.map((category) => [
              category.name,
              peso(category.amount),
              `${category.percent}%`,
            ])
          : [["No spending categories", peso(0), "0%"]],
      theme: "plain",
      margin: { left: 14, right: 14 },
      headStyles: {
        fillColor: brand.blue,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      bodyStyles: {
        textColor: brand.ink,
        lineColor: brand.border,
        lineWidth: 0.2,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        1: { halign: "right", fontStyle: "bold" },
        2: { halign: "right" },
      },
    });

    autoTable(pdf, {
      startY: (pdf.lastAutoTable?.finalY ?? 136) + 10,
      head: [["Budget", "Budgeted", "Spent", "Variance", "Status"]],
      body:
        report.budgetRows.length > 0
          ? report.budgetRows.map((budget) => [
              budget.category,
              peso(budget.budgeted),
              peso(budget.spent),
              peso(budget.variance),
              budget.status,
            ])
          : [["No budgets", peso(0), peso(0), peso(0), "No data"]],
      theme: "plain",
      margin: { left: 14, right: 14 },
      headStyles: {
        fillColor: brand.primaryDark,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      bodyStyles: {
        textColor: brand.ink,
        lineColor: brand.border,
        lineWidth: 0.2,
      },
      alternateRowStyles: { fillColor: brand.panel },
      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 2.8,
      },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right", fontStyle: "bold" },
      },
    });

    const footerY = pdf.internal.pageSize.getHeight() - 12;
    pdf.setDrawColor(...brand.border);
    pdf.line(14, footerY - 6, pageWidth - 14, footerY - 6);
    pdf.setTextColor(...brand.muted);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("SpendWise keeps reports live from your persisted finance data.", 14, footerY);
    pdf.text(`spendwise-report-${report.monthKey}.pdf`, pageWidth - 14, footerY, { align: "right" });
    pdf.save(`spendwise-report-${report.monthKey}.pdf`);
  }, []);

  const setPage = React.useCallback((page: ActivePage) => {
    setActivePage(page);
    setDrawerOpen(false);
    setUserMenuOpen(false);
  }, []);

  const updateForm = React.useCallback((name: keyof typeof forms, value: string) => {
    setForms((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }, []);

  const resetModal = React.useCallback(() => {
    setModal(null);
    setEditingBudget(null);
    setContributionGoal(null);
    setErrors({});
  }, []);

  const openBudgetModal = React.useCallback((budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setForms((current) => ({
        ...current,
        budgetCategory: budget.category,
        budgetAmount: String(budget.allocatedAmount),
        budgetIcon: budget.icon,
        budgetStartDate: budget.periodStart,
        budgetEndDate: budget.periodEnd,
      }));
    } else {
      setEditingBudget(null);
      setForms((current) => ({
        ...current,
        budgetCategory: "",
        budgetAmount: "",
        budgetIcon: iconOptions[0],
        budgetStartDate: todayIso,
        budgetEndDate: todayIso,
      }));
    }
    setErrors({});
    setModal("budget");
  }, [todayIso]);

  const openSavingsEntryModal = React.useCallback((goal: SavingsGoal, entryType: "contribution" | "withdrawal") => {
    setContributionGoal(goal);
    setForms((current) => ({
      ...current,
      savingsEntryType: entryType,
      savingsEntryDate: todayIso,
      savingsEntryNote: "",
      contributionAmount: "",
    }));
    setErrors({});
    setModal("contribution");
  }, [todayIso]);

  const saveIncome = React.useCallback(() => {
    const nextErrors: Record<string, string> = {};
    const amount = Number(forms.incomeAmount);
    if (!forms.source.trim()) nextErrors.source = "Source is required.";
    if (!forms.incomeDate) nextErrors.incomeDate = "Date is required.";
    if (!amount || amount <= 0) nextErrors.incomeAmount = "Amount must be greater than 0.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const formData = new FormData();
    formData.set("source", forms.source.trim());
    formData.set("amount", String(amount));
    formData.set("receivedOn", forms.incomeDate);
    formData.set("note", forms.incomeNote.trim());

    startIncomeMutation(async () => {
      const result = await createIncomeAction(formData);

      if (!result.success || !result.income) {
        toast.error(result.message ?? "Could not save income.");
        return;
      }

      const income = result.income;

      setIncomes((current) => sortIncomes([income, ...current]));
      setTransactions((current) => [toIncomeTransaction(income), ...current]);
      setForms((current) => ({ ...current, source: "", incomeAmount: "", incomeNote: "" }));
      resetModal();
      toast.success("Income saved.");
    });
  }, [forms.incomeAmount, forms.incomeDate, forms.incomeNote, forms.source, resetModal]);

  const saveBudget = React.useCallback(() => {
    const nextErrors: Record<string, string> = {};
    const amount = Number(forms.budgetAmount);
    if (!forms.budgetCategory.trim()) nextErrors.budgetCategory = "Category is required.";
    if (!amount || amount <= 0) nextErrors.budgetAmount = "Amount must be greater than 0.";
    if (!forms.budgetStartDate) nextErrors.budgetStartDate = "Start date is required.";
    if (!forms.budgetEndDate) nextErrors.budgetEndDate = "End date is required.";
    if (forms.budgetStartDate && forms.budgetEndDate && forms.budgetEndDate < forms.budgetStartDate) {
      nextErrors.budgetEndDate = "End date must be on or after the start date.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const formData = new FormData();
    formData.set("category", forms.budgetCategory.trim());
    formData.set("allocatedAmount", String(amount));
    formData.set("icon", forms.budgetIcon);
    formData.set("periodStart", forms.budgetStartDate);
    formData.set("periodEnd", forms.budgetEndDate);

    startBudgetMutation(async () => {
      const result = editingBudget
        ? await updateBudgetAction(editingBudget.id, formData)
        : await createBudgetAction(formData);

      if (!result.success || !result.budget) {
        toast.error(result.message ?? "Could not save budget.");
        return;
      }

      const budget = result.budget;

      setBudgetRecords((current) =>
        sortBudgetRecords(
          editingBudget
            ? current.map((item) => (item.id === editingBudget.id ? budget : item))
            : [budget, ...current]
        )
      );
      resetModal();
      toast.success(editingBudget ? "Budget updated." : "Budget saved.");
    });
  }, [
    editingBudget,
    forms.budgetAmount,
    forms.budgetCategory,
    forms.budgetEndDate,
    forms.budgetIcon,
    forms.budgetStartDate,
    resetModal,
    startBudgetMutation,
  ]);

  const saveExpense = React.useCallback(() => {
    const nextErrors: Record<string, string> = {};
    const amount = Number(forms.expenseAmount);
    if (!forms.expenseCategory.trim()) nextErrors.expenseCategory = "Category is required.";
    if (!forms.expenseDate) nextErrors.expenseDate = "Date is required.";
    if (!amount || amount <= 0) nextErrors.expenseAmount = "Amount must be greater than 0.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const formData = new FormData();
    formData.set("category", forms.expenseCategory.trim());
    formData.set("amount", String(amount));
    formData.set("spentOn", forms.expenseDate);
    formData.set("note", forms.expenseNote.trim());

    startExpenseMutation(async () => {
      const result = await createExpenseAction(formData);

      if (!result.success || !result.expense) {
        toast.error(result.message ?? "Could not save expense.");
        return;
      }

      const expense = result.expense;

      setExpenses((current) => sortExpenses([expense, ...current]));
      setTransactions((current) => [toExpenseTransaction(expense), ...current]);
      setForms((current) => ({ ...current, expenseCategory: "", expenseAmount: "", expenseNote: "" }));
      resetModal();
      toast.success("Expense saved.");
    });
  }, [
    forms.expenseAmount,
    forms.expenseCategory,
    forms.expenseDate,
    forms.expenseNote,
    resetModal,
    startExpenseMutation,
  ]);

  const saveSavingsGoal = React.useCallback(() => {
    const nextErrors: Record<string, string> = {};
    const target = Number(forms.targetAmount);
    const saved = Number(forms.initialSaved);
    if (!forms.goalName.trim()) nextErrors.goalName = "Goal name is required.";
    if (!target || target <= 0) nextErrors.targetAmount = "Target must be greater than 0.";
    if (saved < 0) nextErrors.initialSaved = "Saved amount cannot be negative.";
    if (saved > 0 && !forms.savingsEntryDate) nextErrors.savingsEntryDate = "Date is required.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const formData = new FormData();
    formData.set("name", forms.goalName.trim());
    formData.set("targetAmount", String(target));
    formData.set("initialSaved", String(saved || 0));
    formData.set("entryDate", forms.savingsEntryDate);

    startSavingsMutation(async () => {
      const result = await createSavingsGoalAction(formData);

      if (!result.success || !result.goal) {
        toast.error(result.message ?? "Could not save savings goal.");
        return;
      }

      setSavingsGoals((current) => sortSavingsGoals([result.goal!, ...current]));

      if (result.entry) {
        setSavingsEntries((current) => sortSavingsEntries([result.entry!, ...current]));
        setTransactions((current) => [toSavingsTransaction(result.entry!), ...current]);
      }

      setForms((current) => ({
        ...current,
        goalName: "",
        targetAmount: "",
        initialSaved: "",
        savingsEntryDate: todayIso,
      }));
      resetModal();
      toast.success("Savings goal saved.");
    });
  }, [
    forms.goalName,
    forms.initialSaved,
    forms.savingsEntryDate,
    forms.targetAmount,
    resetModal,
    startSavingsMutation,
    todayIso,
  ]);

  const saveSavingsEntry = React.useCallback(() => {
    if (!contributionGoal) return;
    const amount = Number(forms.contributionAmount);
    if (!amount || amount <= 0) {
      setErrors({ contributionAmount: "Amount must be greater than 0." });
      return;
    }
    if (!forms.savingsEntryDate) {
      setErrors({ savingsEntryDate: "Date is required." });
      return;
    }

    const formData = new FormData();
    formData.set("type", forms.savingsEntryType);
    formData.set("amount", String(amount));
    formData.set("entryDate", forms.savingsEntryDate);
    formData.set("note", forms.savingsEntryNote.trim());

    startSavingsMutation(async () => {
      const result = await createSavingsEntryAction(contributionGoal.id, formData);

      if (!result.success || !result.goal || !result.entry) {
        toast.error(result.message ?? "Could not save savings entry.");
        return;
      }

      setSavingsGoals((current) =>
        sortSavingsGoals(
          current.map((goal) => (goal.id === result.goal!.id ? result.goal! : goal))
        )
      );
      setSavingsEntries((current) => sortSavingsEntries([result.entry!, ...current]));
      setTransactions((current) => [toSavingsTransaction(result.entry!), ...current]);
      setForms((current) => ({
        ...current,
        contributionAmount: "",
        savingsEntryNote: "",
        savingsEntryDate: todayIso,
      }));
      resetModal();
      toast.success(
        forms.savingsEntryType === "withdrawal"
          ? "Savings withdrawal saved."
          : "Savings contribution saved."
      );
    });
  }, [
    contributionGoal,
    forms.contributionAmount,
    forms.savingsEntryDate,
    forms.savingsEntryNote,
    forms.savingsEntryType,
    resetModal,
    startSavingsMutation,
    todayIso,
  ]);

  const deleteIncome = React.useCallback((income: Income) => {
    startIncomeMutation(async () => {
      const result = await deleteIncomeAction(income.id);

      if (!result.success) {
        toast.error(result.message ?? "Could not delete income.");
        return;
      }

      setIncomes((current) => current.filter((item) => item.id !== income.id));
      setTransactions((current) => current.filter((transaction) => transaction.id !== `income-${income.id}`));
      setDeleteTarget(null);
      toast.success("Income deleted.");
    });
  }, [startIncomeMutation]);

  const deleteExpense = React.useCallback((expense: Expense) => {
    startExpenseMutation(async () => {
      const result = await deleteExpenseAction(expense.id);

      if (!result.success) {
        toast.error(result.message ?? "Could not delete expense.");
        return;
      }

      setExpenses((current) => current.filter((item) => item.id !== expense.id));
      setTransactions((current) => current.filter((transaction) => transaction.id !== `expense-${expense.id}`));
      setDeleteTarget(null);
      toast.success("Expense deleted.");
    });
  }, [startExpenseMutation]);

  const deleteBudget = React.useCallback((budget: Budget) => {
    startBudgetMutation(async () => {
      const result = await deleteBudgetAction(budget.id);

      if (!result.success) {
        toast.error(result.message ?? "Could not delete budget.");
        return;
      }

      setBudgetRecords((current) => current.filter((item) => item.id !== budget.id));
      setDeleteTarget(null);
      toast.success("Budget deleted.");
    });
  }, []);

  const deleteSavingsGoal = React.useCallback((goal: SavingsGoal) => {
    startSavingsMutation(async () => {
      const result = await deleteSavingsGoalAction(goal.id);

      if (!result.success) {
        toast.error(result.message ?? "Could not delete savings goal.");
        return;
      }

      setSavingsGoals((current) => current.filter((item) => item.id !== goal.id));
      setSavingsEntries((current) => current.filter((entry) => entry.goalId !== goal.id));
      setTransactions((current) =>
        current.filter((transaction) => {
          if (transaction.type !== "Savings") return true;
          return !savingsEntries.some(
            (entry) => entry.goalId === goal.id && transaction.id === `savings-${entry.id}`
          );
        })
      );
      setDeleteTarget(null);
      toast.success("Savings goal deleted.");
    });
  }, [savingsEntries, startSavingsMutation]);

  const renderDeleteConfirm = React.useCallback(
    (target: string, onYes: () => void) =>
      deleteTarget === target ? (
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-500">Are you sure?</span>
          <button className="text-emerald-700 hover:underline" onClick={onYes}>
            {isMutatingIncome || isMutatingBudget || isMutatingExpense || isMutatingSavings ? "..." : "Yes"}
          </button>
          <button className="text-slate-500 hover:underline" onClick={() => setDeleteTarget(null)}>
            No
          </button>
        </div>
      ) : (
        <button
          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          onClick={() => setDeleteTarget(target)}
          aria-label="Delete"
        >
          <Trash2 className="size-4" />
        </button>
      ),
    [deleteTarget, isMutatingBudget, isMutatingExpense, isMutatingIncome, isMutatingSavings]
  );

  const sidebar = (
    <aside className="flex h-full flex-col border-r border-border/70 bg-card/92 px-3 py-5 backdrop-blur dark:border-white/8 dark:bg-[#07111f]/95">
      <div className="mb-8 flex items-center gap-3 px-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/15 bg-[#07111f] shadow-[0_16px_34px_-22px_rgba(23,178,106,0.8)]">
          <Image
            src="/spendwise-logo.png"
            alt="SpendWise"
            width={48}
            height={48}
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground dark:text-white">
            Spend<span className="text-primary">Wise</span>
          </p>
          <p className="text-xs font-medium text-muted-foreground">Smart budgeting</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavButton key={item.page} item={item} activePage={activePage} onClick={setPage} />
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-primary/15 bg-primary/10 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
        <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">Healthy finances</p>
        <p className="mt-1 text-xs leading-5 text-emerald-700 dark:text-emerald-200/80">Track spending and keep your monthly goals visible.</p>
      </div>
    </aside>
  );

  return (
    <div className="min-h-svh bg-[var(--page-background)] text-foreground dark:[&_.bg-slate-50]:bg-muted/45 dark:[&_.bg-slate-100]:bg-muted dark:[&_.bg-white]:bg-card dark:[&_.border-slate-100]:border-border dark:[&_.border-slate-200]:border-border dark:[&_.text-slate-300]:text-muted-foreground dark:[&_.text-slate-400]:text-muted-foreground dark:[&_.text-slate-500]:text-muted-foreground dark:[&_.text-slate-600]:text-muted-foreground dark:[&_.text-slate-700]:text-foreground dark:[&_.text-slate-900]:text-foreground dark:[&_.text-slate-950]:text-foreground">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block lg:w-[220px]">{sidebar}</div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/45" onClick={() => setDrawerOpen(false)} aria-label="Close menu" />
          <div className="relative h-full w-[280px] max-w-[86vw]">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-[220px]">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#08111f]/90 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="rounded-xl border border-border bg-background/60 p-2 text-muted-foreground lg:hidden dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <h1 className="font-display text-3xl leading-none text-slate-950 sm:text-4xl dark:text-white">{activePage}</h1>
                <p className="mt-1 hidden text-sm text-slate-500 sm:block dark:text-slate-300">Post-login finance workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-border bg-muted/55 px-3 py-2 text-sm font-medium text-muted-foreground md:flex dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
                <CalendarDays className="size-4" />
                {currentDate}
              </div>
              <ThemeToggle />
              <button className="relative rounded-xl border border-border bg-background/60 p-2.5 text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
                <Bell className="size-5" />
                {notifications ? <span className="absolute right-2 top-2 size-2 rounded-full bg-emerald-600" /> : null}
              </button>
              <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-white/10" />
              <div className="relative">
                <button
                  className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-2 py-1.5 text-left dark:border-white/10 dark:bg-white/5"
                  onClick={() => setUserMenuOpen((open) => !open)}
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-100">
                    {initials}
                  </span>
                  <span className="hidden sm:block">
                    <span className="block text-sm font-bold text-slate-900">{profileName || user.name}</span>
                    <span className="block text-xs text-slate-500">Member</span>
                  </span>
                  <ChevronDown className="size-4 text-slate-400 dark:text-slate-200" />
                </button>
                {userMenuOpen ? (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#0b1524] dark:shadow-2xl">
                    <button className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-white/8">
                      Profile
                    </button>
                    <button
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-white/8"
                      onClick={() => setPage("Settings")}
                    >
                      Settings
                    </button>
                    <form action="/auth/signout" method="post">
                      <button className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50">
                        Logout
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div key={activePage} className="animate-in fade-in duration-200">
            {activePage === "Dashboard" ? renderDashboard() : null}
            {activePage === "Income" ? renderIncome() : null}
            {activePage === "Budgets" ? renderBudgets() : null}
            {activePage === "Expenses" ? renderExpenses() : null}
            {activePage === "Savings" ? renderSavings() : null}
            {activePage === "Analytics" ? renderAnalytics() : null}
            {activePage === "Reports" ? renderReports() : null}
            {activePage === "Settings" ? renderSettings() : null}
          </div>
        </main>
      </div>

      {modal ? renderModal() : null}
    </div>
  );

  function renderDashboard() {
    return (
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard icon={TrendingUp} label="Total Income" value={totals.income} color="emerald" badge="+12%" />
          <SummaryCard
            icon={Wallet}
            label="Total Budget"
            value={totals.totalBudget}
            color="blue"
            badge={`${peso(Math.max(0, totals.budgetRemaining))} remaining`}
          />
          <SummaryCard icon={Receipt} label="Total Expenses" value={totals.totalExpenses} color="red" badge="-8%" />
          <SummaryCard icon={PiggyBank} label="Total Savings" value={totals.totalSavings} color="purple" badge="+5%" />
          <SummaryCard
            icon={Landmark}
            label="Remaining Balance"
            value={totals.remainingBalance}
            color={totals.remainingBalance >= 0 ? "emerald" : "red"}
            badge={totals.remainingBalance >= 0 ? "Positive" : "Needs attention"}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel>
            <SectionTitle title="Income vs Expenses" subtitle="Monthly performance" />
            <div className="mt-5 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₱${Number(value) / 1000}k`} />
                  <Tooltip formatter={(value) => peso(Number(value))} />
                  <Bar dataKey="income" fill="#16a34a" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="Expense by Category" subtitle="Live breakdown" />
            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analyticsData.expenseByCategory} dataKey="value" nameKey="name" innerRadius={58} outerRadius={95} paddingAngle={3}>
                    {analyticsData.expenseByCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => peso(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {analyticsData.expenseByCategory.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}
                  </span>
                  <span className="font-bold text-slate-900">{peso(entry.value)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel>
            <SectionTitle title="Budget Progress" subtitle="Allocated versus spent" />
            <div className="mt-5 space-y-4">
              {budgets.map((budget) => (
                <BudgetProgress key={budget.id} budget={budget} />
              ))}
            </div>
          </Panel>
          <Panel>
            <SectionTitle title="Savings Goals" subtitle="Progress toward targets" />
            <div className="mt-5 space-y-4">
              {savingsGoals.map((goal) => (
                <SavingsProgress key={goal.id} goal={goal} />
              ))}
            </div>
          </Panel>
        </section>

        <QuickActions />
        <TransactionsTable transactions={recentTransactions} />
      </div>
    );
  }

  function renderIncome() {
    return (
      <div className="space-y-6">
        <PageHeader title="Income Management" actionLabel="Add Income" onAction={() => setModal("income")} />
        <Panel>
          <p className="text-sm font-semibold text-slate-500">Total recorded income</p>
          <p className="mt-2 text-4xl font-bold text-emerald-700">{peso(totals.income)}</p>
        </Panel>
        <Panel>
          <ResponsiveTable>
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Source</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3 pr-4">Note</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((income) => (
                <tr key={income.id} className="border-b border-slate-100 text-sm last:border-0">
                  <td className="py-4 pr-4 text-slate-500">{income.date}</td>
                  <td className="py-4 pr-4 font-semibold text-slate-900">{income.source}</td>
                  <td className="py-4 pr-4 font-bold text-emerald-700">{peso(income.amount)}</td>
                  <td className="py-4 pr-4 text-slate-500">{income.note || "—"}</td>
                  <td className="py-4 text-right">{renderDeleteConfirm(`income-${income.id}`, () => deleteIncome(income))}</td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </Panel>
      </div>
    );
  }

  function renderBudgets() {
    return (
      <div className="space-y-6">
        <PageHeader title="Budgets" actionLabel="Create Budget" onAction={() => openBudgetModal()} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => (
            <Panel key={budget.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                    {budget.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-950">{budget.category} Budget</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {peso(budget.allocated)} allocated · {peso(budget.spent)} spent
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatBudgetDate(budget.periodStart)} - {formatBudgetDate(budget.periodEnd)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" onClick={() => openBudgetModal(budget)}>
                    <Edit2 className="size-4" />
                  </button>
                  {renderDeleteConfirm(`budget-${budget.id}`, () => deleteBudget(budget))}
                </div>
              </div>
              <div className="mt-5">
                <ProgressBar value={pct(budget.spent, budget.allocated)} tone={barTone(pct(budget.spent, budget.allocated))} />
                <div className="mt-2 flex justify-between text-sm font-semibold">
                  <span>{pct(budget.spent, budget.allocated)}%</span>
                  <span className={cx(budget.remaining >= 0 ? "text-slate-500" : "text-red-600")}>
                    {budget.remaining >= 0 ? `${peso(budget.remaining)} left` : `${peso(Math.abs(budget.remaining))} over`}
                  </span>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    );
  }

  function renderExpenses() {
    return (
      <div className="space-y-6">
        <PageHeader title="Expenses" actionLabel="Add Expense" onAction={() => setModal("expense")} />
        <section className="grid gap-4 md:grid-cols-2">
          <Panel>
            <p className="text-sm font-semibold text-slate-500">Total spent</p>
            <p className="mt-2 text-4xl font-bold text-red-600">{peso(totals.totalExpenses)}</p>
          </Panel>
          <Panel>
            <p className="text-sm font-semibold text-slate-500">Unbudgeted expenses</p>
            <p className="mt-2 text-4xl font-bold text-slate-950">
              {derivedExpenses.filter((expense) => !expense.isBudgeted).length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {peso(
                derivedExpenses
                  .filter((expense) => !expense.isBudgeted)
                  .reduce((sum, expense) => sum + expense.amount, 0)
              )}
            </p>
          </Panel>
        </section>
        <Panel>
          <div className="mb-5 flex flex-wrap gap-2">
            {["All", ...categories].map((category) => (
              <button
                key={category}
                className={cx(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  expenseFilter === category
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                )}
                onClick={() => setExpenseFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <ResponsiveTable>
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3 pr-4">Budget</th>
                <th className="py-3 pr-4">Note</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-slate-100 text-sm last:border-0">
                  <td className="py-4 pr-4 text-slate-500">{expense.date}</td>
                  <td className="py-4 pr-4 font-semibold text-slate-900">{expense.category}</td>
                  <td className="py-4 pr-4 font-bold text-red-600">{peso(expense.amount)}</td>
                  <td className="py-4 pr-4">
                    <Badge tone={expense.isBudgeted ? "green" : "amber"}>
                      {expense.isBudgeted ? "Budgeted" : "Unbudgeted"}
                    </Badge>
                  </td>
                  <td className="py-4 pr-4 text-slate-500">{expense.note || "—"}</td>
                  <td className="py-4 text-right">{renderDeleteConfirm(`expense-${expense.id}`, () => deleteExpense(expense))}</td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </Panel>
      </div>
    );
  }

  function renderSavings() {
    return (
      <div className="space-y-6">
        <PageHeader title="Savings Goals" actionLabel="Add Savings Goal" onAction={() => setModal("savings")} />
        {savingsGoals.length === 0 ? (
          <EmptyState message="No savings goals yet" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {savingsGoals.map((goal) => (
              <Panel key={goal.id}>
                <SavingsProgress goal={goal} />
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <AppButton variant="outline" onClick={() => openSavingsEntryModal(goal, "contribution")}>
                      <Plus className="size-4" />
                      Add Contribution
                    </AppButton>
                    <AppButton variant="outline" onClick={() => openSavingsEntryModal(goal, "withdrawal")}>
                      Withdraw
                    </AppButton>
                  </div>
                  {renderDeleteConfirm(`goal-${goal.id}`, () => deleteSavingsGoal(goal))}
                </div>
              </Panel>
            ))}
          </div>
        )}
        <Panel>
          <SectionTitle title="Recent Savings Activity" subtitle="Latest persisted entries" />
          <div className="mt-5">
            {recentSavingsEntries.length === 0 ? (
              <EmptyState message="No savings activity yet" />
            ) : (
              <ResponsiveTable>
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Goal</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSavingsEntries.map((entry) => {
                    const signedAmount = entry.type === "withdrawal" ? -entry.amount : entry.amount;

                    return (
                      <tr key={entry.id} className="border-b border-slate-100 text-sm last:border-0">
                        <td className="py-4 pr-4 text-slate-500">{entry.date}</td>
                        <td className="py-4 pr-4 font-semibold text-slate-900">{entry.goalName}</td>
                        <td className="py-4 pr-4">
                          <Badge tone={entry.type === "withdrawal" ? "amber" : "blue"}>
                            {entry.type === "withdrawal" ? "Withdrawal" : "Contribution"}
                          </Badge>
                        </td>
                        <td className={cx("py-4 pr-4 font-bold", signedAmount < 0 ? "text-red-600" : "text-blue-700")}>
                          {peso(signedAmount)}
                        </td>
                        <td className="py-4 text-slate-500">{entry.note || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </ResponsiveTable>
            )}
          </div>
        </Panel>
      </div>
    );
  }

  function renderAnalytics() {
    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Avg Monthly Expense" value={peso(analyticsData.summary.avgMonthlyExpense)} />
          <MetricCard label="Highest Spending Category" value={analyticsData.summary.highestSpendingCategory} />
          <MetricCard label="Savings Rate" value={`${analyticsData.summary.savingsRate}%`} />
          <MetricCard label="Budget Efficiency" value={`${analyticsData.summary.budgetEfficiency}%`} />
        </section>
        <Panel>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <SectionTitle title="Income vs Expenses Trend" subtitle={trendSubtitle} />
            <div className="flex flex-col gap-3 sm:items-end">
              <div className="flex flex-wrap gap-2">
                {(["daily", "weekly", "monthly", "custom"] as TrendFilterMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTrendFilterMode(mode)}
                    className={cx(
                      "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                      trendFilterMode === mode
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background/70 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {mode === "custom" ? "Custom" : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              {trendFilterMode === "custom" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <TextInput
                    type="date"
                    value={trendCustomStart}
                    onChange={(event) => setTrendCustomStart(event.target.value)}
                    aria-label="Trend start date"
                  />
                  <TextInput
                    type="date"
                    value={trendCustomEnd}
                    onChange={(event) => setTrendCustomEnd(event.target.value)}
                    aria-label="Trend end date"
                  />
                </div>
              ) : null}
            </div>
          </div>
          {trendData.length === 0 ? (
            <div className="mt-5">
              <EmptyState message="No trend data for this filter" />
            </div>
          ) : (
            <div className="mt-5 h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₱${Number(value) / 1000}k`} />
                  <Tooltip formatter={(value) => peso(Number(value))} />
                  <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="savings" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel>
          <SectionTitle title="Budget Variance" subtitle="Budgeted versus spent by category" />
          <div className="mt-5">
            {analyticsData.budgetVariance.length === 0 ? (
              <EmptyState message="No budget analytics yet" />
            ) : (
              <ResponsiveTable>
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Budgeted</th>
                    <th className="py-3 pr-4">Spent</th>
                    <th className="py-3 pr-4">Variance</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.budgetVariance.map((budget) => {
                    return (
                      <tr key={budget.id} className="border-b border-slate-100 text-sm last:border-0">
                        <td className="py-4 pr-4 font-semibold text-slate-900">{budget.category}</td>
                        <td className="py-4 pr-4 text-slate-600">{peso(budget.budgeted)}</td>
                        <td className="py-4 pr-4 text-slate-600">{peso(budget.spent)}</td>
                        <td className={cx("py-4 pr-4 font-bold", budget.variance >= 0 ? "text-emerald-700" : "text-red-600")}>
                          {peso(budget.variance)}
                        </td>
                        <td className="py-4">
                          <Badge tone={budget.variance >= 0 ? "green" : "red"}>{budget.status}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </ResponsiveTable>
            )}
          </div>
        </Panel>
      </div>
    );
  }

  function renderReports() {
    if (!reportData.hasReportableData || !selectedReport) {
      return <EmptyState message="No reportable finance data yet" />;
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SelectInput
            value={selectedReport.monthKey}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="max-w-xs"
          >
            {reportData.monthOptions.map((item) => (
              <option key={item.monthKey} value={item.monthKey}>
                {item.label}
              </option>
            ))}
          </SelectInput>
          <AppButton onClick={() => exportReportPdf(selectedReport)}>
            <FileText className="size-4" />
            Export PDF
          </AppButton>
        </div>
        <Panel>
          <SectionTitle title={`${selectedReport.monthLabel} Report`} subtitle="Backend-generated monthly summary" />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <MetricCard label="Total Income" value={peso(selectedReport.totalIncome)} />
            <MetricCard label="Total Expenses" value={peso(selectedReport.totalExpenses)} />
            <MetricCard label="Net Savings" value={peso(selectedReport.netSavings)} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <MetricCard label="Savings Contributions" value={peso(selectedReport.savingsContributions)} />
            <MetricCard label="Savings Withdrawals" value={peso(selectedReport.savingsWithdrawals)} />
            <MetricCard label="Net Savings Entries" value={peso(selectedReport.netSavingsEntries)} />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-xl border border-border/70 bg-muted/35 p-4 dark:bg-white/4">
              <h3 className="font-bold text-foreground dark:text-white">Top 3 spending categories</h3>
              {selectedReport.topCategories.length === 0 ? (
                <div className="mt-3 rounded-xl bg-muted/55 px-4 py-3 text-sm font-semibold text-muted-foreground dark:bg-white/4">
                  No categorized spending this month.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {selectedReport.topCategories.map((item) => (
                    <div key={item.name} className="flex justify-between rounded-xl bg-muted/55 px-4 py-3 text-sm dark:bg-white/4">
                      <span className="font-semibold text-foreground">{item.name}</span>
                      <span className="font-bold text-foreground">
                        {peso(item.amount)} ({item.percent}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/35 p-4 dark:bg-white/4">
              <h3 className="font-bold text-foreground dark:text-white">Budget compliance</h3>
              <p className="mt-3 rounded-xl bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100">
                You stayed under budget in {selectedReport.budgetComplianceCount} of {selectedReport.budgetCount} categories ({selectedReport.budgetCompliancePercentage}%).
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <MetricCard label="Income Spent" value={`${selectedReport.incomeSpentPercentage}%`} />
                <MetricCard label="Budget Used" value={`${selectedReport.budgetUsedPercentage}%`} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{selectedReport.statusMessage}</p>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-border/70 bg-muted/35 p-4 dark:bg-white/4">
            <SectionTitle title="Budget Compliance Table" subtitle="Budgeted versus spent for the selected month" />
            <div className="mt-5">
              {selectedReport.budgetRows.length === 0 ? (
                <EmptyState message="No budgets for this report month" />
              ) : (
                <ResponsiveTable>
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-3 pr-4">Category</th>
                      <th className="py-3 pr-4">Budgeted</th>
                      <th className="py-3 pr-4">Spent</th>
                      <th className="py-3 pr-4">Variance</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReport.budgetRows.map((budget) => (
                      <tr key={budget.id} className="border-b border-slate-100 text-sm last:border-0">
                        <td className="py-4 pr-4 font-semibold text-slate-900">{budget.category}</td>
                        <td className="py-4 pr-4 text-slate-600">{peso(budget.budgeted)}</td>
                        <td className="py-4 pr-4 text-slate-600">{peso(budget.spent)}</td>
                        <td className={cx("py-4 pr-4 font-bold", budget.variance >= 0 ? "text-emerald-700" : "text-red-600")}>
                          {peso(budget.variance)}
                        </td>
                        <td className="py-4">
                          <Badge tone={budget.variance >= 0 ? "green" : "red"}>{budget.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </ResponsiveTable>
              )}
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="space-y-6">
        <Panel>
          <SectionTitle title="Profile" subtitle="Editable dashboard profile display" />
          <div className="mt-5 grid gap-4 md:grid-cols-[auto_1fr_1fr] md:items-end">
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-800">
              {initials}
            </div>
            <Field label="Name">
              <TextInput value={profileName} onChange={(event) => setProfileName(event.target.value)} />
            </Field>
            <Field label="Email">
              <TextInput value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} />
            </Field>
          </div>
        </Panel>
        <Panel>
          <SectionTitle title="Preferences" subtitle="Personalize the dashboard interface" />
          <div className="mt-5 space-y-4">
            <ToggleRow label="Compact currency display" checked={compactCurrency} onChange={setCompactCurrency} />
            <ToggleRow label="Notification reminders" checked={notifications} onChange={setNotifications} />
          </div>
        </Panel>
      </div>
    );
  }

  function renderModal() {
    const title =
      modal === "income"
        ? "Add Income"
        : modal === "budget"
          ? editingBudget
            ? "Edit Budget"
            : "Create Budget"
          : modal === "expense"
            ? "Add Expense"
          : modal === "savings"
            ? "Add Savings Goal"
            : modal === "contribution"
              ? forms.savingsEntryType === "withdrawal"
                ? "Add Withdrawal"
                : "Add Contribution"
              : "Financial Report";

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
        <div className="max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-xl border border-border/70 bg-card text-card-foreground shadow-2xl dark:border-white/10 dark:bg-[#0b1524]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-bold text-foreground dark:text-white">{title}</h2>
            <button className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground" onClick={resetModal}>
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-4 px-5 py-5">
            {modal === "income" ? (
              <>
                <Field label="Source" error={errors.source}>
                  <TextInput value={forms.source} invalid={!!errors.source} onChange={(e) => updateForm("source", e.target.value)} placeholder="Monthly Salary" />
                </Field>
                <Field label="Amount" error={errors.incomeAmount}>
                  <TextInput type="number" value={forms.incomeAmount} invalid={!!errors.incomeAmount} onChange={(e) => updateForm("incomeAmount", e.target.value)} placeholder="₱0" />
                </Field>
                <Field label="Date" error={errors.incomeDate}>
                  <TextInput type="date" value={forms.incomeDate} invalid={!!errors.incomeDate} onChange={(e) => updateForm("incomeDate", e.target.value)} />
                </Field>
                <Field label="Note">
                  <TextInput value={forms.incomeNote} onChange={(e) => updateForm("incomeNote", e.target.value)} placeholder="Optional" />
                </Field>
              </>
            ) : null}

            {modal === "budget" ? (
              <>
                <Field label="Category" error={errors.budgetCategory}>
                  <TextInput value={forms.budgetCategory} invalid={!!errors.budgetCategory} onChange={(e) => updateForm("budgetCategory", e.target.value)} placeholder="Food" />
                </Field>
                <Field label="Allocated Amount" error={errors.budgetAmount}>
                  <TextInput type="number" value={forms.budgetAmount} invalid={!!errors.budgetAmount} onChange={(e) => updateForm("budgetAmount", e.target.value)} placeholder="₱0" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Start Date" error={errors.budgetStartDate}>
                    <TextInput type="date" value={forms.budgetStartDate} invalid={!!errors.budgetStartDate} onChange={(e) => updateForm("budgetStartDate", e.target.value)} />
                  </Field>
                  <Field label="End Date" error={errors.budgetEndDate}>
                    <TextInput type="date" value={forms.budgetEndDate} invalid={!!errors.budgetEndDate} onChange={(e) => updateForm("budgetEndDate", e.target.value)} />
                  </Field>
                </div>
                <Field label="Icon">
                  <div className="flex flex-wrap gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        className={cx(
                          "flex size-11 items-center justify-center rounded-xl border text-xl",
                          forms.budgetIcon === icon ? "border-primary bg-primary/10" : "border-border bg-background/70"
                        )}
                        onClick={() => updateForm("budgetIcon", icon)}
                        type="button"
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            ) : null}

            {modal === "expense" ? (
              <>
                <Field label="Category" error={errors.expenseCategory}>
                  <>
                    <TextInput
                      value={forms.expenseCategory}
                      invalid={!!errors.expenseCategory}
                      onChange={(e) => updateForm("expenseCategory", e.target.value)}
                      placeholder="Food"
                      list="expense-category-options"
                    />
                    <datalist id="expense-category-options">
                      {categories.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </>
                </Field>
                <Field label="Amount" error={errors.expenseAmount}>
                  <TextInput type="number" value={forms.expenseAmount} invalid={!!errors.expenseAmount} onChange={(e) => updateForm("expenseAmount", e.target.value)} placeholder="₱0" />
                </Field>
                <Field label="Date" error={errors.expenseDate}>
                  <TextInput type="date" value={forms.expenseDate} invalid={!!errors.expenseDate} onChange={(e) => updateForm("expenseDate", e.target.value)} />
                </Field>
                <Field label="Note">
                  <TextInput value={forms.expenseNote} onChange={(e) => updateForm("expenseNote", e.target.value)} placeholder="Optional" />
                </Field>
              </>
            ) : null}

            {modal === "savings" ? (
              <>
                <Field label="Goal Name" error={errors.goalName}>
                  <TextInput value={forms.goalName} invalid={!!errors.goalName} onChange={(e) => updateForm("goalName", e.target.value)} placeholder="Emergency Fund" />
                </Field>
                <Field label="Target Amount" error={errors.targetAmount}>
                  <TextInput type="number" value={forms.targetAmount} invalid={!!errors.targetAmount} onChange={(e) => updateForm("targetAmount", e.target.value)} placeholder="₱0" />
                </Field>
                <Field label="Initial Saved Amount" error={errors.initialSaved}>
                  <TextInput type="number" value={forms.initialSaved} invalid={!!errors.initialSaved} onChange={(e) => updateForm("initialSaved", e.target.value)} placeholder="₱0" />
                </Field>
                <Field label="Initial Saved Date" error={errors.savingsEntryDate}>
                  <TextInput type="date" value={forms.savingsEntryDate} invalid={!!errors.savingsEntryDate} onChange={(e) => updateForm("savingsEntryDate", e.target.value)} />
                </Field>
              </>
            ) : null}

            {modal === "contribution" ? (
              <>
                <p className="rounded-xl bg-muted/55 p-3 text-sm font-semibold text-foreground dark:bg-white/4">
                  {forms.savingsEntryType === "withdrawal" ? "Withdraw from" : "Add to"} {contributionGoal?.name}
                </p>
                <Field label="Type">
                  <SelectInput value={forms.savingsEntryType} onChange={(e) => updateForm("savingsEntryType", e.target.value)}>
                    <option value="contribution">Contribution</option>
                    <option value="withdrawal">Withdrawal</option>
                  </SelectInput>
                </Field>
                <Field label={forms.savingsEntryType === "withdrawal" ? "Withdrawal Amount" : "Contribution Amount"} error={errors.contributionAmount}>
                  <TextInput type="number" value={forms.contributionAmount} invalid={!!errors.contributionAmount} onChange={(e) => updateForm("contributionAmount", e.target.value)} placeholder="₱0" />
                </Field>
                <Field label="Date" error={errors.savingsEntryDate}>
                  <TextInput type="date" value={forms.savingsEntryDate} invalid={!!errors.savingsEntryDate} onChange={(e) => updateForm("savingsEntryDate", e.target.value)} />
                </Field>
                <Field label="Note">
                  <TextInput value={forms.savingsEntryNote} onChange={(e) => updateForm("savingsEntryNote", e.target.value)} placeholder="Optional" />
                </Field>
              </>
            ) : null}

            {modal === "report" ? (
              selectedReport ? (
                <div className="space-y-4">
                  <SectionTitle title={selectedReport.monthLabel} subtitle="Current selected monthly report" />
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="Income" value={peso(selectedReport.totalIncome)} />
                    <MetricCard label="Expenses" value={peso(selectedReport.totalExpenses)} />
                    <MetricCard label="Net Savings" value={peso(selectedReport.netSavings)} />
                    <MetricCard label="Savings Entries" value={peso(selectedReport.netSavingsEntries)} />
                  </div>
                  <div className="rounded-xl bg-muted/55 p-4 text-sm text-muted-foreground dark:bg-white/4">
                    <p><strong>Top spending:</strong> {selectedReport.topCategories[0]?.name ?? "None"} at {peso(selectedReport.topCategories[0]?.amount ?? 0)}</p>
                    <p className="mt-2"><strong>Income spent:</strong> {selectedReport.incomeSpentPercentage}%</p>
                    <p className="mt-2"><strong>Budget used:</strong> {selectedReport.budgetUsedPercentage}%</p>
                    <p className="mt-2"><strong>Budget compliance:</strong> {selectedReport.budgetComplianceCount}/{selectedReport.budgetCount} categories</p>
                  </div>
                  <p className={cx("rounded-xl p-3 text-sm font-bold", selectedReport.netSavings >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                    {selectedReport.statusMessage}
                  </p>
                </div>
              ) : (
                <EmptyState message="No reportable finance data yet" />
              )
            ) : null}
          </div>

          {modal !== "report" ? (
            <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
              <AppButton variant="outline" onClick={resetModal}>
                Cancel
              </AppButton>
              <AppButton
                disabled={
                  (modal === "income" && isMutatingIncome) ||
                  (modal === "budget" && isMutatingBudget) ||
                  (modal === "expense" && isMutatingExpense) ||
                  ((modal === "savings" || modal === "contribution") && isMutatingSavings)
                }
                onClick={
                  modal === "income"
                    ? saveIncome
                    : modal === "budget"
                      ? saveBudget
                      : modal === "expense"
                      ? saveExpense
                      : modal === "savings"
                        ? saveSavingsGoal
                        : saveSavingsEntry
                }
              >
                {modal === "income" && isMutatingIncome
                  ? "Saving..."
                  : modal === "budget" && isMutatingBudget
                    ? "Saving..."
                    : modal === "expense" && isMutatingExpense
                      ? "Saving..."
                      : (modal === "savings" || modal === "contribution") && isMutatingSavings
                        ? "Saving..."
                    : "Save"}
              </AppButton>
            </div>
          ) : (
            <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
              <AppButton variant="outline" onClick={resetModal}>Close</AppButton>
              <AppButton onClick={() => exportReportPdf(selectedReport)}>Export PDF</AppButton>
            </div>
          )}
        </div>
      </div>
    );
  }

  function QuickActions() {
    return (
      <Panel className="flex flex-wrap gap-3">
        <AppButton onClick={() => setModal("income")}>
          <Plus className="size-4" />
          Add Income
        </AppButton>
        <AppButton variant="outline" onClick={() => openBudgetModal()}>
          <Plus className="size-4" />
          Create Budget
        </AppButton>
        <AppButton variant="outline" onClick={() => setModal("expense")}>
          <Plus className="size-4" />
          Add Expense
        </AppButton>
        <AppButton variant="outline" onClick={() => setModal("savings")}>
          <Plus className="size-4" />
          Add Savings
        </AppButton>
        <AppButton variant="outline" onClick={() => setModal("report")}>
          <FileText className="size-4" />
          View Report
        </AppButton>
      </Panel>
    );
  }

  function TransactionsTable({ transactions: rows }: { transactions: Transaction[] }) {
    return (
      <Panel>
        <SectionTitle title="Recent Transactions" subtitle="Latest 10 records" />
        <div className="mt-5">
          {rows.length === 0 ? (
            <EmptyState message="No transactions yet" />
          ) : (
            <ResponsiveTable>
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100 text-sm last:border-0">
                    <td className="py-4 pr-4 text-slate-500">{transaction.date}</td>
                    <td className="py-4 pr-4">
                      <Badge tone={transaction.type === "Income" ? "green" : transaction.type === "Savings" ? "blue" : "red"}>
                        {transaction.type}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4 font-semibold text-slate-900">{transaction.category}</td>
                    <td className={cx("py-4 pr-4 font-bold", amountClass(transaction))}>{peso(transaction.amount)}</td>
                    <td className="py-4 text-slate-500">{transaction.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveTable>
          )}
        </div>
      </Panel>
    );
  }
}

function NavButton({
  item,
  activePage,
  onClick,
}: {
  item: { page: ActivePage; icon: React.ElementType };
  activePage: ActivePage;
  onClick: (page: ActivePage) => void;
}) {
  const Icon = item.icon;
  const active = activePage === item.page;

  return (
    <button
      className={cx(
        "flex w-full items-center gap-3 rounded-xl border-l-4 px-3 py-2.5 text-sm font-semibold transition",
        active
          ? "border-primary bg-primary/10 text-primary dark:text-emerald-100"
          : "border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      onClick={() => onClick(item.page)}
    >
      <Icon className="size-4" />
      {item.page}
    </button>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-foreground dark:text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <MoreHorizontal className="size-5 text-muted-foreground/55" />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "emerald" | "blue" | "red" | "purple";
  badge: string;
}) {
  return (
    <Panel className="min-h-36">
      <div className="flex items-center justify-between gap-3">
        <div
          className={cx(
            "flex size-11 items-center justify-center rounded-xl",
            color === "emerald" && "bg-primary/10 text-primary dark:text-emerald-100",
            color === "blue" && "bg-blue-500/10 text-blue-700 dark:text-blue-200",
            color === "red" && "bg-red-500/10 text-red-600 dark:text-red-200",
            color === "purple" && "bg-purple-500/10 text-purple-700 dark:text-purple-200"
          )}
        >
          <Icon className="size-5" />
        </div>
        <Badge tone={color === "red" ? "red" : color === "blue" ? "blue" : color === "purple" ? "slate" : "green"}>
          {badge}
        </Badge>
      </div>
      <p className="mt-5 text-sm font-semibold text-muted-foreground">{label}</p>
      <p
        className={cx(
          "mt-1 text-2xl font-bold",
          color === "emerald" && "text-emerald-700",
          color === "blue" && "text-blue-700",
          color === "red" && "text-red-600",
          color === "purple" && "text-purple-700"
        )}
      >
        {peso(value)}
      </p>
    </Panel>
  );
}

function BudgetProgress({ budget }: { budget: Budget }) {
  const percent = pct(budget.spent, budget.allocated);

  return (
    <div className="rounded-xl border border-border/70 bg-muted/55 p-4 dark:bg-white/4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-background/70 text-lg shadow-sm dark:bg-white/8">{budget.icon}</span>
          <div>
            <h3 className="font-bold text-foreground dark:text-white">{budget.category} Budget</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Allocated {peso(budget.allocated)} | Spent {peso(budget.spent)} | Remaining{" "}
              {budget.remaining >= 0 ? peso(budget.remaining) : `-${peso(Math.abs(budget.remaining))}`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatBudgetDate(budget.periodStart)} - {formatBudgetDate(budget.periodEnd)}
            </p>
          </div>
        </div>
        <span className="text-sm font-bold text-foreground">{percent}%</span>
      </div>
      <div className="mt-4">
        <ProgressBar value={percent} tone={barTone(percent)} />
      </div>
    </div>
  );
}

function SavingsProgress({ goal }: { goal: SavingsGoal }) {
  const percent = pct(goal.savedAmount, goal.targetAmount);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground dark:text-white">{goal.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Target: {peso(goal.targetAmount)} | Saved: {peso(goal.savedAmount)}
          </p>
        </div>
        <span className="text-sm font-bold text-emerald-700">{percent}%</span>
      </div>
      <div className="mt-4">
        <ProgressBar value={percent} tone="bg-emerald-600" />
      </div>
      <p className="mt-3 text-sm font-semibold text-muted-foreground">
        {peso(goal.remainingAmount)} remaining to goal
      </p>
    </div>
  );
}

function PageHeader({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80 dark:text-emerald-200/80">Workspace</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground dark:text-white">{title}</h2>
      </div>
      <AppButton onClick={onAction}>
        <Plus className="size-4" />
        {actionLabel}
      </AppButton>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/72 p-4 dark:border-white/8 dark:bg-white/4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold text-foreground dark:text-white">{value}</p>
    </div>
  );
}

function ResponsiveTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse">{children}</table>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/55 p-4 dark:bg-white/4">
      <span className="font-semibold text-foreground">{label}</span>
      <button
        className={cx("flex h-7 w-12 items-center rounded-full p-1 transition", checked ? "bg-emerald-600" : "bg-slate-300")}
        onClick={() => onChange(!checked)}
      >
        <span className={cx("size-5 rounded-full bg-white transition", checked && "translate-x-5")} />
      </button>
    </div>
  );
}
