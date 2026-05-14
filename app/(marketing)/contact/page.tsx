import type { Metadata } from "next";
import { Mail, MapPin, MessageSquareText, PhoneCall } from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact",
};

const contactMethods = [
  {
    icon: Mail,
    title: "Email the team",
    value: "hello@spendwise.app",
    description: "For partnerships, product feedback, or support planning.",
  },
  {
    icon: PhoneCall,
    title: "Call us",
    value: "+63 2 8123 4567",
    description: "Business hours, Monday to Friday, 9:00 AM to 6:00 PM.",
  },
  {
    icon: MessageSquareText,
    title: "Product chat",
    value: "In-app support coming soon",
    description: "This first pass focuses on the interface and mock contact flow.",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-3xl space-y-5">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary/80 dark:text-emerald-200/80">
          Contact SpendWise
        </p>
        <h1 className="font-display text-5xl tracking-tight text-foreground dark:text-white sm:text-6xl">
          Let&apos;s talk about smarter budget workflows.
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Reach out with support questions, partnership ideas, or feedback about the new dark experience.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="border-border/70 bg-card/72 dark:border-white/6 dark:bg-white/4">
          <CardHeader className="space-y-4">
            <CardTitle className="text-foreground dark:text-white">Contact details</CardTitle>
            <CardDescription>
              Choose the channel that fits your question. A real delivery action can be attached later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contactMethods.map((method) => (
              <div
                key={method.title}
                className="rounded-[1.5rem] border border-border/70 bg-muted/55 p-5 dark:border-white/6 dark:bg-background/35"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary dark:text-emerald-200">
                    <method.icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{method.title}</p>
                    <p className="text-sm text-foreground/90">{method.value}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{method.description}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-[1.5rem] border border-primary/15 bg-primary/10 p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-background/60 p-3 text-primary dark:bg-background/40 dark:text-emerald-200">
                  <MapPin className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Based near Las Piñas</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    SpendWise is localized for PHP budgeting patterns and household finance habits in the Philippines.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <ContactForm />
      </div>
    </div>
  );
}
