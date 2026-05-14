import type { Metadata } from "next";
import Link from "next/link";

import { AuthConfirmPanel } from "@/components/auth-confirm-panel";
import { BrandLockup } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Confirm Email",
};

type ConfirmPageProps = {
  searchParams: Promise<{
    token_hash?: string | string[];
    type?: string | string[];
  }>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams;
  const tokenHash = getSingleParam(params.token_hash);
  const type = getSingleParam(params.type);

  return (
    <main className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-sky-500/10 blur-[160px]" />
      </div>
      <div className="relative mx-auto flex min-h-svh w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
            Back to home
          </Link>
          <ThemeToggle />
        </div>

        <section className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-xl">
            <div className="mb-8 flex justify-center">
              <BrandLockup align="center" />
            </div>
            <AuthConfirmPanel tokenHash={tokenHash} type={type} />
          </div>
        </section>
      </div>
    </main>
  );
}
