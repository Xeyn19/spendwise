"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Errors = {
  email?: string;
  password?: string;
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        d="M21.6 12.23c0-.7-.06-1.22-.2-1.77H12v3.35h5.52c-.11.83-.72 2.08-2.08 2.92l-.02.11 3.02 2.29.21.02c1.89-1.72 2.95-4.24 2.95-6.92Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.97-.87 6.62-2.36l-3.21-2.42c-.86.59-2 .99-3.41.99-2.64 0-4.87-1.72-5.67-4.11l-.11.01-3.14 2.38-.04.11C4.68 19.91 8.08 22 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.33 14.1A5.87 5.87 0 0 1 6 12c0-.73.13-1.44.32-2.1l-.01-.14-3.18-2.42-.1.05A9.87 9.87 0 0 0 2 12c0 1.58.38 3.08 1.05 4.42l3.28-2.32Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.8c1.77 0 2.97.75 3.65 1.38l2.67-2.56C16.96 3.38 14.7 2 12 2 8.08 2 4.68 4.09 3.03 7.39l3.29 2.51C7.13 7.52 9.36 5.8 12 5.8Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextErrors: Errors = {};

    if (!email) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Enter your password.";
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
      });
    }, 900);
  }

  return (
    <Card className="border-border/70 bg-card/88">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl text-foreground">Welcome back</CardTitle>
        <CardDescription>
          Sign in to review your budget snapshot and track this week&apos;s spending.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button type="button" variant="outline" className="w-full justify-center rounded-2xl">
          <GoogleMark />
          Continue with Google
        </Button>
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="login-email" name="email" type="email" placeholder="you@example.com" className="pl-11" />
            </div>
            {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="login-password">Password</Label>
              <Link href="/register" className="text-sm text-primary transition hover:text-primary/80">
                Need an account?
              </Link>
            </div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
          </div>
          <Button type="submit" className="w-full rounded-2xl" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="space-y-2 rounded-[1.4rem] border border-primary/15 bg-primary/10 p-4">
          <p className="text-sm font-medium text-primary">UI-only demo flow</p>
          <p className="text-sm text-muted-foreground">
            Google OAuth and real authentication are intentionally deferred in this pass.
          </p>
          {submitted ? <p className="text-sm text-primary">Mock sign-in successful.</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
