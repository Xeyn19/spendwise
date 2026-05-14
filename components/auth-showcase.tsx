import { BrandLockup } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  { value: "₱18.4k", label: "Monthly savings tracked" },
  { value: "92%", label: "Budget targets completed" },
  { value: "6 mins", label: "Average weekly check-in" },
];

export function AuthShowcase() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top,rgba(35,186,108,0.14),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(234,243,239,0.98))] p-6 shadow-[0_24px_80px_-48px_rgba(17,24,39,0.24)] sm:p-8 dark:border-white/8 dark:bg-[radial-gradient(circle_at_top,rgba(81,230,151,0.22),transparent_34%),linear-gradient(180deg,rgba(12,24,38,0.96),rgba(5,10,18,0.98))] dark:shadow-none">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent" />
      <div className="relative space-y-8">
        <BrandLockup className="max-w-max" />
        <div className="space-y-4">
          <p className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-primary dark:text-emerald-100">
            Modern money clarity
          </p>
          <h2 className="font-display max-w-lg text-3xl leading-tight tracking-tight text-foreground dark:text-white sm:text-4xl">
            Turn daily spending into calm, visible progress.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground dark:text-slate-300">
            Build routines that feel light: fast check-ins, cleaner categories,
            and a dashboard that makes every peso easier to understand.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-border/70 bg-background/70 dark:border-white/8 dark:bg-white/6">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-foreground dark:text-white">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground dark:text-slate-300">{metric.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
