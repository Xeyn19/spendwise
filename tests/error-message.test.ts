import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicErrorMessage, reportPublicError } from "../lib/error-message";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("public error mapping", () => {
  it("returns an allowlisted message for a known code", () => {
    expect(
      getPublicErrorMessage(
        { code: "23514", message: "private database detail" },
        "Could not save savings entry.",
        { "23514": "Withdrawal cannot be greater than the current saved amount." }
      )
    ).toBe("Withdrawal cannot be greater than the current saved amount.");
  });

  it.each([
    { message: "relation private_table does not exist" },
    { code: "UNKNOWN", message: "provider secret text" },
    "raw upstream failure",
    null,
  ])("never returns unknown provider or database details", (error) => {
    const fallback = "Something went wrong. Try again.";
    const result = getPublicErrorMessage(error, fallback, { "23514": "Known error." });

    expect(result).toBe(fallback);
    expect(result).not.toContain("private_table");
    expect(result).not.toContain("provider secret");
    expect(result).not.toContain("upstream failure");
  });

  it("logs the private error server-side while returning only the fallback", () => {
    const privateError = { message: "sensitive SQL detail" };
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(reportPublicError("load finance data", privateError, "Could not load data.")).toBe(
      "Could not load data."
    );
    expect(consoleSpy).toHaveBeenCalledWith("load finance data", privateError);
  });
});
