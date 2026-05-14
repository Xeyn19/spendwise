export type AuthActionState = {
  success: boolean;
  message: string | null;
};

export const initialAuthActionState: AuthActionState = {
  success: false,
  message: null,
};
