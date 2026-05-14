"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { initialAuthActionState } from "@/app/(auth)/auth-action-state";
import { registerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Errors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full rounded-2xl" disabled={pending}>
      {pending ? "Creating account..." : "Create account"}
    </Button>
  );
}

export function RegisterForm() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});
  const [state, formAction] = useActionState(registerAction, initialAuthActionState);
  const lastToastKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!state.message) {
      return;
    }

    const toastKey = `${state.success}:${state.message}`;

    if (lastToastKeyRef.current === toastKey) {
      return;
    }

    lastToastKeyRef.current = toastKey;

    if (state.success) {
      toast.success(state.message);
      return;
    }

    toast.error(state.message);
  }, [state.message, state.success]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const terms = formData.get("terms");
    const nextErrors: Errors = {};

    if (!firstName) nextErrors.firstName = "Enter your first name.";
    if (!lastName) nextErrors.lastName = "Enter your last name.";
    if (!email) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!password) {
      nextErrors.password = "Choose a password.";
    } else if (password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (!terms) nextErrors.terms = "You must accept the terms to continue.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      toast.error("Fix the highlighted registration fields and try again.");
      return;
    }
  }

  return (
    <Card className="border-border/70 bg-card/88">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl text-foreground">Create your account</CardTitle>
        <CardDescription>
          Set up your SpendWise workspace and start tracking smarter in minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-5" action={formAction} onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="register-first-name">First name</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="register-first-name" name="firstName" placeholder="Edgar" className="pl-11" />
              </div>
              {errors.firstName ? <p className="text-sm text-destructive">{errors.firstName}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-last-name">Last name</Label>
              <Input id="register-last-name" name="lastName" placeholder="Santos" />
              {errors.lastName ? <p className="text-sm text-destructive">{errors.lastName}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="register-email" name="email" type="email" placeholder="you@example.com" className="pl-11" />
            </div>
            {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Choose a password"
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
            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">Confirm password</Label>
              <div className="relative">
                <Input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-start gap-3 rounded-[1.4rem] border border-border/70 bg-muted/55 p-4 dark:bg-background/35">
              <Checkbox name="terms" className="mt-0.5" />
              <span className="space-y-1 text-sm text-muted-foreground">
                <span className="block font-medium text-foreground">Agree to the terms</span>
                <span>
                  I agree to create a real SpendWise account and receive a confirmation email to activate it.
                </span>
              </span>
            </label>
            {errors.terms ? <p className="text-sm text-destructive">{errors.terms}</p> : null}
          </div>
          <SubmitButton />
        </form>
        <div className="flex flex-col gap-2 rounded-[1.4rem] border border-border/70 bg-muted/55 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between dark:bg-background/35">
          <span>Already have an account?</span>
          <Link className="font-medium text-primary transition hover:text-primary/80" href="/login">
            Sign in instead
          </Link>
        </div>
        {state.message ? (
          <div className="rounded-[1.4rem] border border-primary/15 bg-primary/10 p-4 text-sm text-primary">
            {state.message}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
