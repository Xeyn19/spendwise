"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ConfirmState = {
  status: "verifying" | "success" | "error";
  message: string;
};

type AuthConfirmPanelProps = {
  tokenHash?: string;
  type?: string;
};

export function AuthConfirmPanel({ tokenHash, type }: AuthConfirmPanelProps) {
  const [state, setState] = React.useState<ConfirmState>(() => {
    if (!tokenHash || !type) {
      return {
        status: "error",
        message: "This confirmation link is missing required details.",
      };
    }

    return {
      status: "verifying",
      message: "We are confirming your email address.",
    };
  });
  const requestStartedRef = React.useRef(false);

  React.useEffect(() => {
    if (!tokenHash || !type || requestStartedRef.current) {
      return;
    }

    requestStartedRef.current = true;

    async function verifyEmail() {
      try {
        const response = await fetch("/auth/confirm/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tokenHash, type }),
        });
        const result = (await response.json()) as {
          success?: boolean;
          message?: string;
        };
        const message =
          result.message ??
          (response.ok
            ? "Your email is confirmed."
            : "This confirmation link could not be verified.");

        if (!response.ok || !result.success) {
          setState({ status: "error", message });
          toast.error(message);
          return;
        }

        setState({ status: "success", message });
        toast.success(message);
      } catch {
        const message = "Could not connect to the confirmation server.";
        setState({ status: "error", message });
        toast.error(message);
      }
    }

    void verifyEmail();
  }, [tokenHash, type]);

  const isSuccess = state.status === "success";
  const isError = state.status === "error";

  return (
    <Card className="border-border/70 bg-card/88">
      <CardHeader className="items-center space-y-5 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:text-emerald-200">
          {state.status === "verifying" ? (
            <Loader2 className="size-7 animate-spin" />
          ) : isSuccess ? (
            <CheckCircle2 className="size-7" />
          ) : (
            <AlertCircle className="size-7" />
          )}
        </div>
        <div className="space-y-3">
          <CardTitle className="font-display text-4xl leading-none text-foreground sm:text-5xl">
            {state.status === "verifying"
              ? "Confirming your email"
              : isSuccess
                ? "Email confirmed"
                : "Confirmation failed"}
          </CardTitle>
          <CardDescription className="mx-auto max-w-md text-base leading-7">
            {state.message}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.status === "verifying" ? (
          <div className="rounded-2xl border border-border/70 bg-muted/55 p-4 text-center text-sm text-muted-foreground dark:bg-background/35">
            Keep this tab open while SpendWise verifies the secure token from your email.
          </div>
        ) : null}

        {isSuccess ? (
          <Button asChild className="w-full rounded-2xl">
            <Link href="/login?confirmed=success">
              Continue to sign in
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}

        {isError ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="rounded-2xl">
              <Link href="/login">
                Go to login
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl">
              <Link href="/register">
                <MailCheck className="size-4" />
                Register again
              </Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
