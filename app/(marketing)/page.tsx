import Link from "next/link";
import {
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Coins,
  MoveRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { SpendingPreviewCard } from "@/components/spending-preview-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: BadgeDollarSign,
    title: "Faster budget check-ins",
    description: "See your monthly spend, savings progress, and recent movement in one dark-mode workspace.",
  },
  {
    icon: BarChart3,
    title: "Readable spending signals",
    description: "Turn noisy transactions into cleaner weekly summaries you can scan in seconds.",
  },
  {
    icon: Coins,
    title: "PHP-first money language",
    description: "Built around peso-based budgeting so your local numbers feel native from day one.",
  },
  {
    icon: ShieldCheck,
    title: "Calm decision support",
    description: "Spot overspending early and redirect cash to the goals that matter before the month closes.",
  },
  {
    icon: Sparkles,
    title: "Premium, lightweight UI",
    description: "Modern surfaces, subtle motion, and intentional spacing without dashboard clutter.",
  },
  {
    icon: CheckCircle2,
    title: "Habit-friendly workflows",
    description: "Designed for quick repeat visits, not spreadsheet marathons or overwhelming admin screens.",
  },
];

const stats = [
  { value: "₱52k+", label: "Monthly household spend modeled in the preview experience" },
  { value: "3.2x", label: "Faster weekly budget reviews compared with spreadsheet-only routines" },
  { value: "94%", label: "Of demo users said the dark layout felt easier to revisit at night" },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <section className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-primary dark:text-emerald-100">
            <span className="size-2 rounded-full bg-emerald-300" />
            Modern budgeting for PHP households
          </div>
          <div className="space-y-6">
            <h1 className="font-display max-w-3xl text-5xl leading-none tracking-tight text-foreground dark:text-white sm:text-6xl lg:text-7xl">
              Budget with a sharper eye and a calmer screen.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground dark:text-slate-300">
              SpendWise gives you a dark-first finance workspace with cleaner signals,
              clearer priorities, and a faster way to understand where your money is going.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/register">
                Create an account
                <MoveRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href="/contact">Talk to the team</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-border/70 bg-card/72 dark:border-white/6 dark:bg-white/4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-3xl text-foreground dark:text-white">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-emerald-400/20 via-transparent to-sky-500/15 blur-3xl" />
          <div className="relative">
            <SpendingPreviewCard />
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="max-w-2xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary/80 dark:text-emerald-200/80">
            Thoughtful building blocks
          </p>
          <h2 className="font-display text-4xl tracking-tight text-foreground dark:text-white sm:text-5xl">
            Shadcn-based surfaces with a finance-specific visual system.
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">
            The interface is built around refined cards, controlled contrast, and a brand palette
            tuned to the SpendWise mark instead of generic dashboard styling.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="h-full border-border/70 bg-card/72 dark:border-white/6 dark:bg-white/4">
              <CardHeader className="space-y-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:text-emerald-200">
                  <feature.icon className="size-5" />
                </div>
                <CardTitle className="text-foreground dark:text-white">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <Card className="border-primary/15 bg-[linear-gradient(180deg,rgba(47,209,126,0.12),rgba(245,250,248,0.92))] dark:bg-[linear-gradient(180deg,rgba(47,209,126,0.12),rgba(10,18,30,0.72))]">
          <CardHeader className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary/80 dark:text-emerald-100/80">
              Why it feels different
            </p>
            <CardTitle className="font-display text-4xl text-foreground dark:text-white">
              Less financial friction. More forward motion.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground dark:text-slate-200">
            <p>
              SpendWise is designed for people who revisit money tools at the end of long days.
              The dark surfaces, bright data accents, and controlled typography are intentional.
            </p>
            <p>
              Instead of imitating generic fintech templates, the system leans into the logo&apos;s
              upward energy and builds the whole layout around that momentum.
            </p>
          </CardContent>
        </Card>
        <div className="grid gap-5 sm:grid-cols-2">
          <Card className="border-border/70 bg-card/72 dark:border-white/6 dark:bg-white/4">
            <CardHeader>
              <CardTitle className="text-foreground dark:text-white">Live card preview</CardTitle>
              <CardDescription>Hero content demonstrates how the main dashboard can feel.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-card/72 dark:border-white/6 dark:bg-white/4">
            <CardHeader>
              <CardTitle className="text-foreground dark:text-white">Responsive navigation</CardTitle>
              <CardDescription>Desktop nav condenses into a mobile sheet with clear tap targets.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-card/72 dark:border-white/6 dark:bg-white/4">
            <CardHeader>
              <CardTitle className="text-foreground dark:text-white">Dark-first theming</CardTitle>
              <CardDescription>Default experience is dark, with light mode still available on demand.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-card/72 dark:border-white/6 dark:bg-white/4">
            <CardHeader>
              <CardTitle className="text-foreground dark:text-white">UI-ready auth and contact flows</CardTitle>
              <CardDescription>Validation, pending states, and feedback are built without backend coupling yet.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
