import { redirect } from "next/navigation";

import { SpendWiseDashboard } from "@/components/spendwise-dashboard";
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

  return <SpendWiseDashboard user={{ name: fullName, email }} />;
}
