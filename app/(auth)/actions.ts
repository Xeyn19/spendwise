"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AuthActionState } from "@/app/(auth)/auth-action-state";
import { createClient } from "@/lib/supabase/server";

function getBaseUrl(headerStore: Awaited<ReturnType<typeof headers>>) {
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

function mapAuthError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (normalizedMessage.includes("user already registered")) {
    return "An account with this email already exists.";
  }

  return message;
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();
  const headerStore = await headers();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getBaseUrl(headerStore),
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    return {
      success: false,
      message: mapAuthError(error.message),
    };
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    success: true,
    message:
      "Account created. Check your email and confirm your address to finish signing in.",
  };
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: mapAuthError(error.message),
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
