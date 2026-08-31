import { redirect } from "next/navigation";

import { SpendWiseDashboard } from "@/components/spendwise-dashboard";
import { emptyAnalyticsData } from "@/lib/analytics-shared";
import { listUserAnalytics } from "@/lib/analytics";
import { listUserBudgets } from "@/lib/budgets";
import { listUserExpenses } from "@/lib/expenses";
import { listUserIncomes } from "@/lib/incomes";
import { listUserReports } from "@/lib/reports";
import { emptyReportData } from "@/lib/reports-shared";
import { listUserSavings } from "@/lib/savings";
import { createClient } from "@/lib/supabase/server";
import { listUserTransactions } from "@/lib/transactions";

async function loadDashboardData<T>(
  loader: () => Promise<T>,
  fallback: T,
  errorMessage: string
) {
  try {
    return await loader();
  } catch (error) {
    console.error(errorMessage, error);
    return fallback;
  }
}

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
  const [incomes, budgets, expenses, savings, recentTransactions, analytics, reports] =
    await Promise.all([
      loadDashboardData(listUserIncomes, [], "Could not load incomes for dashboard."),
      loadDashboardData(listUserBudgets, [], "Could not load budgets for dashboard."),
      loadDashboardData(listUserExpenses, [], "Could not load expenses for dashboard."),
      loadDashboardData(
        listUserSavings,
        { goals: [], entries: [] },
        "Could not load savings for dashboard."
      ),
      loadDashboardData(
        listUserTransactions,
        [],
        "Could not load transactions for dashboard."
      ),
      loadDashboardData(
        listUserAnalytics,
        emptyAnalyticsData,
        "Could not load analytics for dashboard."
      ),
      loadDashboardData(
        listUserReports,
        emptyReportData,
        "Could not load reports for dashboard."
      ),
    ]);
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
