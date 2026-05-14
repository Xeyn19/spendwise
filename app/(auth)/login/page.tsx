import type { Metadata } from "next";
import { cookies } from "next/headers";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const cookieStore = await cookies();
  const logoutSuccess = cookieStore.get("spendwise_logout")?.value === "success";

  return <LoginForm logoutSuccess={logoutSuccess} />;
}
