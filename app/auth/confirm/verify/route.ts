import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { reportPublicError } from "@/lib/error-message";
import { createStatelessAuthClient } from "@/lib/supabase/stateless";

const validOtpTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    tokenHash?: unknown;
    type?: unknown;
  } | null;
  const tokenHash = typeof body?.tokenHash === "string" ? body.tokenHash : "";
  const type = typeof body?.type === "string" ? body.type : "";

  if (!tokenHash || !validOtpTypes.has(type as EmailOtpType)) {
    return NextResponse.json(
      { success: false, message: "Confirmation link is missing required details." },
      { status: 400 }
    );
  }

  const supabase = createStatelessAuthClient();
  const { error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: reportPublicError(
          "verify email confirmation OTP",
          error,
          "This confirmation link is invalid, expired, or was already used."
        ),
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Your email is confirmed. Sign in to continue to your dashboard.",
  });
}
