export const REGISTRATION_NAME_MAX_LENGTH = 80;
export const REGISTRATION_EMAIL_MAX_LENGTH = 254;
export const REGISTRATION_PASSWORD_MIN_LENGTH = 8;
export const REGISTRATION_PASSWORD_MAX_LENGTH = 128;

export type RegistrationFieldErrors = Partial<
  Record<
    | "firstName"
    | "lastName"
    | "email"
    | "password"
    | "confirmPassword"
    | "terms",
    string
  >
>;

export type RegistrationInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

export type ValidatedRegistrationInput = Omit<
  RegistrationInput,
  "confirmPassword" | "acceptedTerms"
>;

export type RegistrationValidationResult =
  | { success: true; data: ValidatedRegistrationInput }
  | { success: false; fieldErrors: RegistrationFieldErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readRegistrationFormData(formData: FormData): RegistrationInput {
  return {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    acceptedTerms: formData.get("terms") !== null,
  };
}

export function validateRegistrationInput(
  input: RegistrationInput
): RegistrationValidationResult {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const fieldErrors: RegistrationFieldErrors = {};

  if (!firstName) {
    fieldErrors.firstName = "Enter your first name.";
  } else if (firstName.length > REGISTRATION_NAME_MAX_LENGTH) {
    fieldErrors.firstName = `Use ${REGISTRATION_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!lastName) {
    fieldErrors.lastName = "Enter your last name.";
  } else if (lastName.length > REGISTRATION_NAME_MAX_LENGTH) {
    fieldErrors.lastName = `Use ${REGISTRATION_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (!email) {
    fieldErrors.email = "Enter your email address.";
  } else if (email.length > REGISTRATION_EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!input.password) {
    fieldErrors.password = "Choose a password.";
  } else if (input.password.length < REGISTRATION_PASSWORD_MIN_LENGTH) {
    fieldErrors.password = `Use at least ${REGISTRATION_PASSWORD_MIN_LENGTH} characters.`;
  } else if (input.password.length > REGISTRATION_PASSWORD_MAX_LENGTH) {
    fieldErrors.password = `Use ${REGISTRATION_PASSWORD_MAX_LENGTH} characters or fewer.`;
  }

  if (!input.confirmPassword) {
    fieldErrors.confirmPassword = "Confirm your password.";
  } else if (input.confirmPassword !== input.password) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (!input.acceptedTerms) {
    fieldErrors.terms = "You must accept the terms to continue.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  return {
    success: true,
    data: {
      firstName,
      lastName,
      email,
      password: input.password,
    },
  };
}

export function validateRegistrationFormData(
  formData: FormData
): RegistrationValidationResult {
  return validateRegistrationInput(readRegistrationFormData(formData));
}
