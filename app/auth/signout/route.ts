import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");

  const response = NextResponse.redirect(new URL("/login?logout=success", request.url), {
    status: 303,
  });

  response.cookies.set("spendwise_logout", "success", {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });

  return response;
}
