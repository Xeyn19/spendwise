"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { BudgetRecord } from "@/lib/budget-shared";
import { sanitizeErrorMessage } from "@/lib/error-message";
import type { ExpenseRecord } from "@/lib/expense-shared";
import { normalizeCategoryKey } from "@/lib/expense-shared";
import type { IncomeRecord } from "@/lib/income-shared";
import type { SavingsEntryRecord, SavingsEntryType, SavingsGoalRecord } from "@/lib/savings-shared";
import { getSavingsEntrySignedAmount } from "@/lib/savings-shared";
import { createClient } from "@/lib/supabase/server";

type IncomeActionResult = {
  success: boolean;
  message?: string;
  income?: IncomeRecord;
  deletedId?: string;
};

type BudgetActionResult = {
  success: boolean;
  message?: string;
  budget?: BudgetRecord;
  deletedId?: string;
};

type ExpenseActionResult = {
  success: boolean;
  message?: string;
  expense?: ExpenseRecord;
  deletedId?: string;
};

type SavingsGoalActionResult = {
  success: boolean;
  message?: string;
  goal?: SavingsGoalRecord;
  entry?: SavingsEntryRecord;
  deletedId?: string;
};

type SavingsEntryActionResult = {
  success: boolean;
  message?: string;
  goal?: SavingsGoalRecord;
  entry?: SavingsEntryRecord;
  deletedId?: string;
};

function parseAmount(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount;
}

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toSavingsGoalRecord(row: {
  id: string;
  name: string;
  target_amount: number | string;
  created_at: string;
}, savedAmount = 0): SavingsGoalRecord {
  const targetAmount = Number(row.target_amount);

  return {
    id: row.id,
    name: row.name,
    targetAmount,
    savedAmount,
    remainingAmount: Math.max(0, targetAmount - savedAmount),
    createdAt: row.created_at,
  };
}

function toSavingsEntryRecord(row: {
  id: string;
  goal_id: string;
  type: SavingsEntryType;
  amount: number | string;
  entry_date: string;
  note: string | null;
  created_at: string;
}, goalName: string): SavingsEntryRecord {
  return {
    id: row.id,
    goalId: row.goal_id,
    goalName,
    type: row.type,
    amount: Number(row.amount),
    date: row.entry_date,
    note: row.note ?? "",
    createdAt: row.created_at,
  };
}

async function getSavingsGoalWithSavedAmount({
  goalId,
  userId,
}: {
  goalId: string;
  userId: string;
}) {
  const supabase = await createClient();
  const { data: goal, error: goalError } = await supabase
    .from("savings_goals")
    .select("id, name, target_amount, created_at")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (goalError) {
    return {
      error: sanitizeErrorMessage(goalError.message, "Could not load savings goal."),
    };
  }

  if (!goal) {
    return { error: "Savings goal not found." };
  }

  const { data: entries, error: entriesError } = await supabase
    .from("savings_entries")
    .select("type, amount")
    .eq("goal_id", goalId)
    .eq("user_id", userId);

  if (entriesError) {
    return {
      error: sanitizeErrorMessage(entriesError.message, "Could not load savings entries."),
    };
  }

  const savedAmount = (entries ?? []).reduce(
    (sum, entry) =>
      sum +
      getSavingsEntrySignedAmount({
        type: entry.type as SavingsEntryType,
        amount: Number(entry.amount),
      }),
    0
  );

  return {
    goal: toSavingsGoalRecord(goal, savedAmount),
  };
}

function toBudgetRecord(row: {
  id: string;
  category: string;
  icon: string;
  allocated_amount: number | string;
  period_start: string;
  period_end: string;
  created_at: string;
}): BudgetRecord {
  return {
    id: row.id,
    category: row.category,
    icon: row.icon,
    allocatedAmount: Number(row.allocated_amount),
    periodStart: row.period_start,
    periodEnd: row.period_end,
    createdAt: row.created_at,
  };
}

async function validateBudgetInput({
  userId,
  category,
  allocatedAmount,
  periodStart,
  periodEnd,
  budgetId,
}: {
  userId: string;
  category: string;
  allocatedAmount: number;
  periodStart: string;
  periodEnd: string;
  budgetId?: string;
}): Promise<string | null> {
  const supabase = await createClient();
  const categoryKey = normalizeCategoryKey(category);

  const sameCategoryQuery = supabase
    .from("budgets")
    .select("id")
    .eq("user_id", userId)
    .eq("category_key", categoryKey)
    .lte("period_start", periodEnd)
    .gte("period_end", periodStart);

  if (budgetId) {
    sameCategoryQuery.neq("id", budgetId);
  }

  const { data: sameCategoryOverlaps, error: overlapError } =
    await sameCategoryQuery;

  if (overlapError) {
    return sanitizeErrorMessage(overlapError.message, "Could not validate budget overlap.");
  }

  if ((sameCategoryOverlaps ?? []).length > 0) {
    return "A budget for this category already overlaps the selected date range.";
  }

  const overlappingBudgetsQuery = supabase
    .from("budgets")
    .select("id, allocated_amount")
    .eq("user_id", userId)
    .lte("period_start", periodEnd)
    .gte("period_end", periodStart);

  if (budgetId) {
    overlappingBudgetsQuery.neq("id", budgetId);
  }

  const { data: overlappingBudgets, error: budgetError } =
    await overlappingBudgetsQuery;

  if (budgetError) {
    return sanitizeErrorMessage(budgetError.message, "Could not validate budget allocation.");
  }

  const { data: incomes, error: incomeError } = await supabase
    .from("incomes")
    .select("amount")
    .eq("user_id", userId)
    .gte("received_on", periodStart)
    .lte("received_on", periodEnd);

  if (incomeError) {
    return sanitizeErrorMessage(incomeError.message, "Could not validate budget against income.");
  }

  const overlappingBudgetTotal = (overlappingBudgets ?? []).reduce(
    (sum, budget) => sum + Number(budget.allocated_amount),
    0
  );
  const samePeriodIncome = (incomes ?? []).reduce(
    (sum, income) => sum + Number(income.amount),
    0
  );

  if (overlappingBudgetTotal + allocatedAmount > samePeriodIncome) {
    return "Budget allocation exceeds recorded income for the selected date range.";
  }

  return null;
}

async function validateIncomeDeletion({
  userId,
  incomeId,
  receivedOn,
}: {
  userId: string;
  incomeId: string;
  receivedOn: string;
}): Promise<string | null> {
  const supabase = await createClient();
  const { data: affectedBudgets, error: affectedBudgetsError } = await supabase
    .from("budgets")
    .select("id, period_start, period_end")
    .eq("user_id", userId)
    .lte("period_start", receivedOn)
    .gte("period_end", receivedOn);

  if (affectedBudgetsError) {
    return sanitizeErrorMessage(
      affectedBudgetsError.message,
      "Could not validate income deletion."
    );
  }

  for (const budget of affectedBudgets ?? []) {
    const { data: overlappingBudgets, error: budgetError } = await supabase
      .from("budgets")
      .select("allocated_amount")
      .eq("user_id", userId)
      .lte("period_start", budget.period_end)
      .gte("period_end", budget.period_start);

    if (budgetError) {
      return sanitizeErrorMessage(
        budgetError.message,
        "Could not validate income deletion."
      );
    }

    const { data: incomes, error: incomeError } = await supabase
      .from("incomes")
      .select("id, amount")
      .eq("user_id", userId)
      .gte("received_on", budget.period_start)
      .lte("received_on", budget.period_end);

    if (incomeError) {
      return sanitizeErrorMessage(
        incomeError.message,
        "Could not validate income deletion."
      );
    }

    const budgetTotal = (overlappingBudgets ?? []).reduce(
      (sum, item) => sum + Number(item.allocated_amount),
      0
    );
    const remainingIncome = (incomes ?? []).reduce(
      (sum, item) => sum + (item.id === incomeId ? 0 : Number(item.amount)),
      0
    );

    if (budgetTotal > remainingIncome) {
      return "Deleting this income would make existing budgets exceed recorded income for the affected period.";
    }
  }

  return null;
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

  const { data: income, error: incomeLookupError } = await supabase
    .from("incomes")
    .select("id, received_on")
    .eq("id", incomeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (incomeLookupError) {
    return {
      success: false,
      message: sanitizeErrorMessage(
        incomeLookupError.message,
        "Could not load income."
      ),
    };
  }

  if (!income) {
    return { success: false, message: "Income record not found." };
  }

  const validationMessage = await validateIncomeDeletion({
    userId,
    incomeId,
    receivedOn: income.received_on,
  });

  if (validationMessage) {
    return { success: false, message: validationMessage };
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

export async function createExpenseAction(formData: FormData): Promise<ExpenseActionResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const category = String(formData.get("category") ?? "").trim();
  const amountValue = String(formData.get("amount") ?? "").trim();
  const spentOn = String(formData.get("spentOn") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const amount = parseAmount(amountValue);

  if (!category) {
    return { success: false, message: "Category is required." };
  }

  if (!isValidDateString(spentOn)) {
    return { success: false, message: "Date is required." };
  }

  if (!amount || amount <= 0) {
    return { success: false, message: "Amount must be greater than 0." };
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      category,
      amount,
      spent_on: spentOn,
      note,
    })
    .select("id, category, amount, spent_on, note, created_at")
    .single();

  if (error) {
    return {
      success: false,
      message: sanitizeErrorMessage(error.message, "Could not save expense."),
    };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    expense: {
      id: data.id,
      category: data.category,
      amount: Number(data.amount),
      date: data.spent_on,
      note: data.note ?? "",
      createdAt: data.created_at,
    },
  };
}

export async function deleteExpenseAction(expenseId: string): Promise<ExpenseActionResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("user_id", userId);

  if (error) {
    return {
      success: false,
      message: sanitizeErrorMessage(error.message, "Could not delete expense."),
    };
  }

  revalidatePath("/dashboard");

  return { success: true, deletedId: expenseId };
}

export async function createBudgetAction(formData: FormData): Promise<BudgetActionResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const category = String(formData.get("category") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const amountValue = String(formData.get("allocatedAmount") ?? "").trim();
  const periodStart = String(formData.get("periodStart") ?? "").trim();
  const periodEnd = String(formData.get("periodEnd") ?? "").trim();
  const allocatedAmount = parseAmount(amountValue);

  if (!category) {
    return { success: false, message: "Category is required." };
  }

  if (!icon) {
    return { success: false, message: "Icon is required." };
  }

  if (!allocatedAmount || allocatedAmount <= 0) {
    return { success: false, message: "Amount must be greater than 0." };
  }

  if (!isValidDateString(periodStart)) {
    return { success: false, message: "Start date is required." };
  }

  if (!isValidDateString(periodEnd)) {
    return { success: false, message: "End date is required." };
  }

  if (periodEnd < periodStart) {
    return { success: false, message: "End date must be on or after the start date." };
  }

  const validationMessage = await validateBudgetInput({
    userId,
    category,
    allocatedAmount,
    periodStart,
    periodEnd,
  });

  if (validationMessage) {
    return { success: false, message: validationMessage };
  }

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: userId,
      category,
      icon,
      allocated_amount: allocatedAmount,
      period_start: periodStart,
      period_end: periodEnd,
    })
    .select("id, category, icon, allocated_amount, period_start, period_end, created_at")
    .single();

  if (error) {
    return {
      success: false,
      message: sanitizeErrorMessage(error.message, "Could not save budget."),
    };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    budget: toBudgetRecord(data),
  };
}

export async function updateBudgetAction(
  budgetId: string,
  formData: FormData
): Promise<BudgetActionResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const category = String(formData.get("category") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const amountValue = String(formData.get("allocatedAmount") ?? "").trim();
  const periodStart = String(formData.get("periodStart") ?? "").trim();
  const periodEnd = String(formData.get("periodEnd") ?? "").trim();
  const allocatedAmount = parseAmount(amountValue);

  if (!category) {
    return { success: false, message: "Category is required." };
  }

  if (!icon) {
    return { success: false, message: "Icon is required." };
  }

  if (!allocatedAmount || allocatedAmount <= 0) {
    return { success: false, message: "Amount must be greater than 0." };
  }

  if (!isValidDateString(periodStart)) {
    return { success: false, message: "Start date is required." };
  }

  if (!isValidDateString(periodEnd)) {
    return { success: false, message: "End date is required." };
  }

  if (periodEnd < periodStart) {
    return { success: false, message: "End date must be on or after the start date." };
  }

  const validationMessage = await validateBudgetInput({
    userId,
    category,
    allocatedAmount,
    periodStart,
    periodEnd,
    budgetId,
  });

  if (validationMessage) {
    return { success: false, message: validationMessage };
  }

  const { data, error } = await supabase
    .from("budgets")
    .update({
      category,
      icon,
      allocated_amount: allocatedAmount,
      period_start: periodStart,
      period_end: periodEnd,
    })
    .eq("id", budgetId)
    .eq("user_id", userId)
    .select("id, category, icon, allocated_amount, period_start, period_end, created_at")
    .single();

  if (error) {
    return {
      success: false,
      message: sanitizeErrorMessage(error.message, "Could not update budget."),
    };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    budget: toBudgetRecord(data),
  };
}

export async function deleteBudgetAction(budgetId: string): Promise<BudgetActionResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", userId);

  if (error) {
    return {
      success: false,
      message: sanitizeErrorMessage(error.message, "Could not delete budget."),
    };
  }

  revalidatePath("/dashboard");

  return { success: true, deletedId: budgetId };
}

export async function createSavingsGoalAction(
  formData: FormData
): Promise<SavingsGoalActionResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const targetAmountValue = String(formData.get("targetAmount") ?? "").trim();
  const initialSavedValue = String(formData.get("initialSaved") ?? "").trim();
  const targetAmount = parseAmount(targetAmountValue);
  const initialSaved = initialSavedValue ? parseAmount(initialSavedValue) : 0;
  const entryDate = String(formData.get("entryDate") ?? "").trim();

  if (!name) {
    return { success: false, message: "Goal name is required." };
  }

  if (!targetAmount || targetAmount <= 0) {
    return { success: false, message: "Target must be greater than 0." };
  }

  if (initialSaved === null || initialSaved < 0) {
    return { success: false, message: "Saved amount cannot be negative." };
  }

  if (initialSaved > 0 && !isValidDateString(entryDate)) {
    return { success: false, message: "Savings date is required." };
  }

  const { data: goalData, error: goalError } = await supabase
    .from("savings_goals")
    .insert({
      user_id: userId,
      name,
      target_amount: targetAmount,
    })
    .select("id, name, target_amount, created_at")
    .single();

  if (goalError) {
    return {
      success: false,
      message: sanitizeErrorMessage(goalError.message, "Could not save savings goal."),
    };
  }

  let entry: SavingsEntryRecord | undefined;

  if (initialSaved > 0) {
    const { data: entryData, error: entryError } = await supabase
      .from("savings_entries")
      .insert({
        user_id: userId,
        goal_id: goalData.id,
        type: "contribution",
        amount: initialSaved,
        entry_date: entryDate,
        note: "Initial savings",
      })
      .select("id, goal_id, type, amount, entry_date, note, created_at")
      .single();

    if (entryError) {
      await supabase
        .from("savings_goals")
        .delete()
        .eq("id", goalData.id)
        .eq("user_id", userId);

      return {
        success: false,
        message: sanitizeErrorMessage(entryError.message, "Could not save initial savings."),
      };
    }

    entry = toSavingsEntryRecord(
      { ...entryData, type: entryData.type as SavingsEntryType },
      goalData.name
    );
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    goal: toSavingsGoalRecord(goalData, initialSaved),
    entry,
  };
}

export async function deleteSavingsGoalAction(
  goalId: string
): Promise<SavingsGoalActionResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) {
    return {
      success: false,
      message: sanitizeErrorMessage(error.message, "Could not delete savings goal."),
    };
  }

  revalidatePath("/dashboard");

  return { success: true, deletedId: goalId };
}

export async function createSavingsEntryAction(
  goalId: string,
  formData: FormData
): Promise<SavingsEntryActionResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const type = String(formData.get("type") ?? "").trim();
  const amountValue = String(formData.get("amount") ?? "").trim();
  const entryDate = String(formData.get("entryDate") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const amount = parseAmount(amountValue);

  if (type !== "contribution" && type !== "withdrawal") {
    return { success: false, message: "Savings entry type is required." };
  }

  if (!amount || amount <= 0) {
    return { success: false, message: "Amount must be greater than 0." };
  }

  if (!isValidDateString(entryDate)) {
    return { success: false, message: "Date is required." };
  }

  const goalResult = await getSavingsGoalWithSavedAmount({ goalId, userId });

  if (goalResult.error || !goalResult.goal) {
    return {
      success: false,
      message: goalResult.error ?? "Savings goal not found.",
    };
  }

  if (type === "withdrawal" && amount > goalResult.goal.savedAmount) {
    return {
      success: false,
      message: "Withdrawal cannot be greater than the current saved amount.",
    };
  }

  const { data, error } = await supabase
    .from("savings_entries")
    .insert({
      user_id: userId,
      goal_id: goalId,
      type,
      amount,
      entry_date: entryDate,
      note,
    })
    .select("id, goal_id, type, amount, entry_date, note, created_at")
    .single();

  if (error) {
    return {
      success: false,
      message: sanitizeErrorMessage(error.message, "Could not save savings entry."),
    };
  }

  const entry = toSavingsEntryRecord(
    { ...data, type: data.type as SavingsEntryType },
    goalResult.goal.name
  );
  const nextSavedAmount =
    goalResult.goal.savedAmount + getSavingsEntrySignedAmount(entry);

  revalidatePath("/dashboard");

  return {
    success: true,
    entry,
    goal: {
      ...goalResult.goal,
      savedAmount: nextSavedAmount,
      remainingAmount: Math.max(0, goalResult.goal.targetAmount - nextSavedAmount),
    },
  };
}
