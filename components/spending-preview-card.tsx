import { ArrowUpRight, Coffee, CreditCard, PiggyBank, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const transactions = [
  { icon: Coffee, label: "Morning coffee", category: "Food", amount: "-₱185" },
  { icon: CreditCard, label: "Internet bill", category: "Utilities", amount: "-₱1,699" },
  { icon: PiggyBank, label: "Emergency fund", category: "Savings", amount: "+₱2,500" },
];

export function SpendingPreviewCard() {
  return (
    <Card className="overflow-hidden border-emerald-400/10 bg-[radial-gradient(circle_at_top,rgba(80,255,168,0.14),transparent_38%),linear-gradient(180deg,rgba(16,25,40,0.96),rgba(7,13,23,0.94))]">
      <CardHeader className="gap-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-emerald-200 uppercase">
            Live snapshot
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            <Wallet className="size-3.5 text-emerald-300" />
            Budget sync
          </div>
        </div>
        <div className="space-y-3">
          <CardTitle className="text-2xl sm:text-3xl">This month&apos;s balance</CardTitle>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-semibold tracking-tight text-white">₱28,450</p>
              <p className="mt-2 text-sm text-muted-foreground">13% healthier than April</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-3 text-emerald-200">
              <ArrowUpRight className="size-5" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.4rem] border border-white/6 bg-white/4 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Spent</p>
            <p className="mt-3 text-2xl font-semibold text-white">₱14,320</p>
          </div>
          <div className="rounded-[1.4rem] border border-emerald-400/12 bg-emerald-400/8 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Saved</p>
            <p className="mt-3 text-2xl font-semibold text-emerald-200">₱6,950</p>
          </div>
        </div>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.label}
              className="flex items-center justify-between rounded-[1.4rem] border border-white/6 bg-background/55 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-400/12 p-2 text-emerald-300">
                  <transaction.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{transaction.label}</p>
                  <p className="text-xs text-muted-foreground">{transaction.category}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-foreground">{transaction.amount}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
