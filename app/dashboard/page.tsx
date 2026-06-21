import { redirect } from "next/navigation";

import { SpendWiseDashboard } from "@/components/spendwise-dashboard";
import { emptyAnalyticsData } from "@/lib/analytics-shared";
import { listUserAnalytics } from "@/lib/analytics";
import { listUserBudgets } from "@/lib/budgets";
import { listUserExpenses } from "@/lib/expenses";
import { toExpenseTransaction } from "@/lib/expense-shared";
import { toIncomeTransaction } from "@/lib/income-shared";
import { listUserIncomes } from "@/lib/incomes";
import { listUserReports } from "@/lib/reports";
import { emptyReportData } from "@/lib/reports-shared";
import { listUserSavings } from "@/lib/savings";
import { toSavingsTransaction } from "@/lib/savings-shared";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, first_name, last_name")
    .eq("id", claims.sub)
    .maybeSingle();

  const firstName = profile?.first_name ?? "SpendWise";
  const lastName = profile?.last_name ?? "Member";
  const fullName = `${firstName} ${lastName}`.trim();
  const email =
    profile?.email ??
    (typeof claims.email === "string" ? claims.email : "No email available");
  let incomes: Awaited<ReturnType<typeof listUserIncomes>> = [];
  let budgets: Awaited<ReturnType<typeof listUserBudgets>> = [];
  let expenses: Awaited<ReturnType<typeof listUserExpenses>> = [];
  let savings: Awaited<ReturnType<typeof listUserSavings>> = {
    goals: [],
    entries: [],
  };
  let analytics: Awaited<ReturnType<typeof listUserAnalytics>> = emptyAnalyticsData;
  let reports: Awaited<ReturnType<typeof listUserReports>> = emptyReportData;

  try {
    incomes = await listUserIncomes();
  } catch (error) {
    console.error("Could not load incomes for dashboard.", error);
  }

  try {
    budgets = await listUserBudgets();
  } catch (error) {
    console.error("Could not load budgets for dashboard.", error);
  }

  try {
    expenses = await listUserExpenses();
  } catch (error) {
    console.error("Could not load expenses for dashboard.", error);
  }

  try {
    savings = await listUserSavings();
  } catch (error) {
    console.error("Could not load savings for dashboard.", error);
  }

  try {
    analytics = await listUserAnalytics();
  } catch (error) {
    console.error("Could not load analytics for dashboard.", error);
  }

  try {
    reports = await listUserReports();
  } catch (error) {
    console.error("Could not load reports for dashboard.", error);
  }

  const recentTransactions = [
    ...incomes.map(toIncomeTransaction),
    ...expenses.map(toExpenseTransaction),
    ...savings.entries.map(toSavingsTransaction),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <SpendWiseDashboard
      user={{ name: fullName, email }}
      initialIncomes={incomes}
      initialBudgets={budgets}
      initialExpenses={expenses}
      initialSavingsGoals={savings.goals}
      initialSavingsEntries={savings.entries}
      initialTransactions={recentTransactions}
      initialAnalyticsData={analytics}
      initialReportData={reports}
      todayIso={todayIso}
    />
  );
}
