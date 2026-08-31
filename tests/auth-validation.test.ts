import { describe, expect, it } from "vitest";

import {
  REGISTRATION_EMAIL_MAX_LENGTH,
  REGISTRATION_NAME_MAX_LENGTH,
  REGISTRATION_PASSWORD_MAX_LENGTH,
  REGISTRATION_PASSWORD_MIN_LENGTH,
  validateRegistrationInput,
  type RegistrationInput,
} from "../lib/auth-validation";

const validInput: RegistrationInput = {
  firstName: "Edgar",
  lastName: "Santos",
  email: "edgar@example.com",
  password: "secure-pass",
  confirmPassword: "secure-pass",
  acceptedTerms: true,
};

function expectFieldError(
  changes: Partial<RegistrationInput>,
  field: keyof Exclude<ReturnType<typeof validateRegistrationInput>, { success: true }>["fieldErrors"]
) {
  const result = validateRegistrationInput({ ...validInput, ...changes });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.fieldErrors[field]).toBeTruthy();
  }
}

describe("validateRegistrationInput", () => {
  it("trims names and normalizes email casing", () => {
    const result = validateRegistrationInput({
      ...validInput,
      firstName: "  Edgar  ",
      lastName: "  Santos ",
      email: "  EDGAR@EXAMPLE.COM ",
    });

    expect(result).toEqual({
      success: true,
      data: {
        firstName: "Edgar",
        lastName: "Santos",
        email: "edgar@example.com",
        password: validInput.password,
      },
    });
  });

  it.each([
    [{ firstName: "   " }, "firstName"],
    [{ lastName: "   " }, "lastName"],
    [{ email: "not-an-email" }, "email"],
    [{ password: "" }, "password"],
    [{ confirmPassword: "" }, "confirmPassword"],
    [{ acceptedTerms: false }, "terms"],
  ] as const)("rejects invalid registration field %s", (changes, field) => {
    expectFieldError(changes, field);
  });

  it("accepts names at the maximum length", () => {
    const result = validateRegistrationInput({
      ...validInput,
      firstName: "a".repeat(REGISTRATION_NAME_MAX_LENGTH),
      lastName: "b".repeat(REGISTRATION_NAME_MAX_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  it("rejects names over the maximum length", () => {
    expectFieldError(
      { firstName: "a".repeat(REGISTRATION_NAME_MAX_LENGTH + 1) },
      "firstName"
    );
    expectFieldError(
      { lastName: "b".repeat(REGISTRATION_NAME_MAX_LENGTH + 1) },
      "lastName"
    );
  });

  it("accepts and rejects email boundary lengths", () => {
    const maximumEmail = `${"a".repeat(REGISTRATION_EMAIL_MAX_LENGTH - 12)}@example.com`;
    const accepted = validateRegistrationInput({ ...validInput, email: maximumEmail });

    expect(maximumEmail).toHaveLength(REGISTRATION_EMAIL_MAX_LENGTH);
    expect(accepted.success).toBe(true);
    expectFieldError({ email: `a${maximumEmail}` }, "email");
  });

  it("accepts password boundary lengths", () => {
    for (const length of [REGISTRATION_PASSWORD_MIN_LENGTH, REGISTRATION_PASSWORD_MAX_LENGTH]) {
      const password = "p".repeat(length);
      expect(
        validateRegistrationInput({
          ...validInput,
          password,
          confirmPassword: password,
        }).success
      ).toBe(true);
    }
  });

  it("rejects passwords outside the allowed boundaries", () => {
    const tooShort = "p".repeat(REGISTRATION_PASSWORD_MIN_LENGTH - 1);
    const tooLong = "p".repeat(REGISTRATION_PASSWORD_MAX_LENGTH + 1);

    expectFieldError({ password: tooShort, confirmPassword: tooShort }, "password");
    expectFieldError({ password: tooLong, confirmPassword: tooLong }, "password");
  });

  it("rejects a password confirmation mismatch", () => {
    expectFieldError({ confirmPassword: "different-password" }, "confirmPassword");
  });
});
