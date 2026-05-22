import { redirect } from "next/navigation";

import { SpendWiseDashboard } from "@/components/spendwise-dashboard";
import { listUserBudgets } from "@/lib/budgets";
import { toIncomeTransaction } from "@/lib/income-shared";
import { listUserIncomes } from "@/lib/incomes";
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

  const recentTransactions = incomes
    .map(toIncomeTransaction)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);
  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <SpendWiseDashboard
      user={{ name: fullName, email }}
      initialIncomes={incomes}
      initialBudgets={budgets}
      initialTransactions={recentTransactions}
      todayIso={todayIso}
    />
  );
}
