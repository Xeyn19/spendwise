"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Errors = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

export function ContactForm() {
  const [errors, setErrors] = React.useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const nextErrors: Errors = {};

    if (!name) nextErrors.name = "Tell us your name.";
    if (!email) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!subject) nextErrors.subject = "Add a subject.";
    if (!message) {
      nextErrors.message = "Tell us how we can help.";
    } else if (message.length < 20) {
      nextErrors.message = "Add a bit more detail so we can respond well.";
    }

    setErrors(nextErrors);
    setSubmitted(false);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      React.startTransition(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        form.reset();
      });
    }, 900);
  }

  return (
    <Card className="border-border/70 bg-card/88">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl text-foreground">Send us a message</CardTitle>
        <CardDescription>
          This form is UI-only for now, but the feedback state and validation flow are ready.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {submitted ? (
          <div className="rounded-[1.4rem] border border-primary/15 bg-primary/10 p-4 text-sm text-primary">
            Message queued successfully. This is mock feedback until the real delivery action is added.
          </div>
        ) : null}
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name</Label>
              <Input id="contact-name" name="name" placeholder="How should we address you?" />
              {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" name="email" type="email" placeholder="you@example.com" />
              {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-subject">Subject</Label>
            <Input id="contact-subject" name="subject" placeholder="Budget question, partnership, support..." />
            {errors.subject ? <p className="text-sm text-destructive">{errors.subject}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              name="message"
              placeholder="Share the context, desired outcome, and any relevant details."
            />
            {errors.message ? <p className="text-sm text-destructive">{errors.message}</p> : null}
          </div>
          <Button type="submit" className="w-full rounded-2xl sm:w-auto" disabled={isSubmitting}>
            <Send className="size-4" />
            {isSubmitting ? "Sending..." : "Send message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
