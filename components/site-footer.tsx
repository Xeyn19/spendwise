import Link from "next/link";

import { BrandLockup } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row">
          <div className="max-w-md space-y-4">
            <BrandLockup />
            <p className="text-sm leading-7 text-muted-foreground">
              SpendWise helps households build calmer financial routines with clear
              tracking, cleaner decisions, and more confidence over every peso.
            </p>
          </div>
          <div className="grid gap-8 text-sm sm:grid-cols-2">
            <div className="space-y-3">
              <p className="font-medium text-foreground">Explore</p>
              <div className="space-y-2 text-muted-foreground">
                <Link className="block transition hover:text-foreground" href="/">
                  Home
                </Link>
                <Link className="block transition hover:text-foreground" href="/contact">
                  Contact
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              <p className="font-medium text-foreground">Account</p>
              <div className="space-y-2 text-muted-foreground">
                <Link className="block transition hover:text-foreground" href="/login">
                  Login
                </Link>
                <Link className="block transition hover:text-foreground" href="/register">
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Designed for dark-mode finance workflows. Currency defaults to PHP.</p>
          <p>© 2026 SpendWise. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
