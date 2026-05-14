import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/12 blur-[120px]" />
        <div className="absolute top-[28rem] right-[-8rem] h-80 w-80 rounded-full bg-sky-500/8 blur-[140px]" />
      </div>
      <SiteHeader />
      <main className="relative flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
