"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sanitizeErrorMessage } from "@/lib/error-message";
import type { IncomeRecord } from "@/lib/income-shared";
import { createClient } from "@/lib/supabase/server";

type IncomeActionResult = {
  success: boolean;
  message?: string;
  income?: IncomeRecord;
  deletedId?: string;
};

function parseAmount(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount;
}

export async function createIncomeAction(formData: FormData): Promise<IncomeActionResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const source = String(formData.get("source") ?? "").trim();
  const amountValue = String(formData.get("amount") ?? "").trim();
  const receivedOn = String(formData.get("receivedOn") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const amount = parseAmount(amountValue);

  if (!source) {
    return { success: false, message: "Source is required." };
  }

  if (!receivedOn) {
    return { success: false, message: "Date is required." };
  }

  if (!amount || amount <= 0) {
    return { success: false, message: "Amount must be greater than 0." };
  }

  const { data, error } = await supabase
    .from("incomes")
    .insert({
      user_id: userId,
      source,
      amount,
      received_on: receivedOn,
      note,
    })
    .select("id, source, amount, received_on, note, created_at")
    .single();

  if (error) {
    return {
      success: false,
      message: sanitizeErrorMessage(error.message, "Could not save income."),
    };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    income: {
      id: data.id,
      source: data.source,
      amount: Number(data.amount),
      date: data.received_on,
      note: data.note ?? "",
      createdAt: data.created_at,
    },
  };
}

export async function deleteIncomeAction(incomeId: string): Promise<IncomeActionResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("incomes")
    .delete()
    .eq("id", incomeId)
    .eq("user_id", userId);

  if (error) {
    return {
      success: false,
      message: sanitizeErrorMessage(error.message, "Could not delete income."),
    };
  }

  revalidatePath("/dashboard");

  return { success: true, deletedId: incomeId };
}
