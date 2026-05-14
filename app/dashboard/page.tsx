import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, UserRound } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <main className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-12 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-sky-500/10 blur-[160px]" />
      </div>
      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
            Back to home
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" className="rounded-full">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <Card className="border-primary/15 bg-[linear-gradient(180deg,rgba(47,209,126,0.12),rgba(245,250,248,0.92))] dark:bg-[linear-gradient(180deg,rgba(47,209,126,0.12),rgba(10,18,30,0.72))]">
            <CardHeader className="space-y-5">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary/80 dark:text-emerald-100/80">
                Protected dashboard
              </p>
              <CardTitle className="font-display text-5xl leading-none tracking-tight text-foreground dark:text-white sm:text-6xl">
                You&apos;re signed in.
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-8">
                This page proves the Supabase cookie session, protected route check,
                and profile lookup are all working with your Next.js app.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-border/70 bg-card/72 p-5 dark:border-white/6 dark:bg-white/4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Account</p>
                <p className="mt-3 text-2xl font-semibold text-foreground dark:text-white">{fullName}</p>
                <p className="mt-2 text-sm text-muted-foreground">{email}</p>
              </div>
              <div className="rounded-[1.4rem] border border-border/70 bg-card/72 p-5 dark:border-white/6 dark:bg-white/4">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:text-emerald-200">
                  <ShieldCheck className="size-5" />
                </div>
                <p className="mt-4 text-lg font-semibold text-foreground dark:text-white">
                  Session protected
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Access is guarded with a server-side claims check before this page renders.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border-border/70 bg-card/88">
              <CardHeader className="space-y-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:text-emerald-200">
                  <UserRound className="size-5" />
                </div>
                <CardTitle className="text-foreground dark:text-white">What&apos;s wired</CardTitle>
                <CardDescription>
                  Email/password auth, confirmation handling, cookie refresh, and profile loading are now connected.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
                <p>Register writes first and last name into Supabase signup metadata.</p>
                <p>Confirmation links verify through the server route and create a real session.</p>
                <p>Login redirects here only after Supabase accepts the credentials.</p>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/88">
              <CardHeader className="space-y-3">
                <CardTitle className="text-foreground dark:text-white">Next build-out</CardTitle>
                <CardDescription>
                  The auth foundation is ready for the first private product area.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="rounded-full">
                  <Link href="/contact">
                    Continue building
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
