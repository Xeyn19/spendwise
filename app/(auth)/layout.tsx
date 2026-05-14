import type { ReactNode } from "react";
import Link from "next/link";

import { AuthShowcase } from "@/components/auth-showcase";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-sky-500/10 blur-[160px]" />
      </div>
      <div className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
            Back to home
          </Link>
          <ThemeToggle />
        </div>
        <div className="grid flex-1 items-stretch gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <AuthShowcase />
          <div className="flex items-center justify-center">
            <div className="w-full max-w-xl">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
