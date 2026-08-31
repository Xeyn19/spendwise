import type { RegistrationFieldErrors } from "@/lib/auth-validation";

export type AuthActionState = {
  success: boolean;
  message: string | null;
  fieldErrors?: RegistrationFieldErrors;
};

export const initialAuthActionState: AuthActionState = {
  success: false,
  message: null,
};
