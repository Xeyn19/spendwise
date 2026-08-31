"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AuthActionState } from "@/app/(auth)/auth-action-state";
import { validateRegistrationFormData } from "@/lib/auth-validation";
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

function mapAuthError(error: unknown) {
  console.error("Supabase authentication request failed.", error);

  const normalizedMessage =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  if (normalizedMessage.includes("rate limit")) {
    return "Supabase is temporarily rate-limiting signup emails. Wait a few minutes, then try again.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (normalizedMessage.includes("user already registered")) {
    return "An account with this email already exists.";
  }

  return "Authentication failed. Check your details and try again.";
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const validation = validateRegistrationFormData(formData);

  if (!validation.success) {
    return {
      success: false,
      message: "Fix the highlighted registration fields and try again.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const { email, password, firstName, lastName } = validation.data;

  let signUpResult: Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["signUp"]>>;

  try {
    const supabase = await createClient();
    const headerStore = await headers();

    signUpResult = await supabase.auth.signUp({
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
  } catch (error) {
    console.error("Supabase signup request could not be completed.", error);
    return {
      success: false,
      message:
        "Could not reach Supabase from the server. Check the production Supabase environment variables and try again.",
    };
  }

  const { data, error } = signUpResult;

  if (error) {
    return {
      success: false,
      message: mapAuthError(error),
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
      message: mapAuthError(error),
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard?login=success");
}
