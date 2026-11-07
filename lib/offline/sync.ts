"use client";

import {
  createBudgetAction,
  createExpenseAction,
  createIncomeAction,
  createSavingsEntryAction,
  createSavingsGoalAction,
  deleteBudgetAction,
  deleteExpenseAction,
  deleteIncomeAction,
  deleteSavingsGoalAction,
  updateBudgetAction,
  type BudgetActionResult,
  type ExpenseActionResult,
  type IncomeActionResult,
  type SavingsEntryActionResult,
  type SavingsGoalActionResult,
} from "@/app/dashboard/actions";
import type { OfflineMutation } from "@/lib/offline/types";

export type OfflineMutationResult =
  | IncomeActionResult
  | BudgetActionResult
  | ExpenseActionResult
  | SavingsGoalActionResult
  | SavingsEntryActionResult;

function setFormValues(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

export async function executeOfflineMutation(
  mutation: OfflineMutation
): Promise<OfflineMutationResult> {
  switch (mutation.type) {
    case "create-income":
      return createIncomeAction(
        setFormValues({
          clientId: mutation.payload.id,
          source: mutation.payload.source,
          amount: String(mutation.payload.amount),
          receivedOn: mutation.payload.date,
          note: mutation.payload.note,
        })
      );
    case "delete-income":
      return deleteIncomeAction(mutation.payload.id);
    case "create-expense":
      return createExpenseAction(
        setFormValues({
          clientId: mutation.payload.id,
          category: mutation.payload.category,
          amount: String(mutation.payload.amount),
          spentOn: mutation.payload.date,
          note: mutation.payload.note,
        })
      );
    case "delete-expense":
      return deleteExpenseAction(mutation.payload.id);
    case "create-budget":
    case "update-budget": {
      const formData = setFormValues({
        clientId: mutation.payload.id,
        category: mutation.payload.category,
        icon: mutation.payload.icon,
        allocatedAmount: String(mutation.payload.allocatedAmount),
        periodStart: mutation.payload.periodStart,
        periodEnd: mutation.payload.periodEnd,
      });
      return mutation.type === "create-budget"
        ? createBudgetAction(formData)
        : updateBudgetAction(mutation.payload.id, formData);
    }
    case "delete-budget":
      return deleteBudgetAction(mutation.payload.id);
    case "create-savings-goal":
      return createSavingsGoalAction(
        setFormValues({
          clientId: mutation.payload.goal.id,
          entryClientId: mutation.payload.initialEntry?.id ?? "",
          name: mutation.payload.goal.name,
          targetAmount: String(mutation.payload.goal.targetAmount),
          initialSaved: String(mutation.payload.initialEntry?.amount ?? 0),
          entryDate: mutation.payload.initialEntry?.date ?? "",
        })
      );
    case "delete-savings-goal":
      return deleteSavingsGoalAction(mutation.payload.id);
    case "create-savings-entry":
      return createSavingsEntryAction(
        mutation.payload.goalId,
        setFormValues({
          clientId: mutation.payload.id,
          type: mutation.payload.type,
          amount: String(mutation.payload.amount),
          entryDate: mutation.payload.date,
          note: mutation.payload.note,
        })
      );
  }
}
