export type PublicErrorMessagesByCode = Readonly<Record<string, string>>;

function getErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
}

export function getPublicErrorMessage(
  error: unknown,
  fallback: string,
  messagesByCode: PublicErrorMessagesByCode = {}
) {
  const code = getErrorCode(error);

  if (code && messagesByCode[code]) {
    return messagesByCode[code];
  }

  return fallback;
}

export function reportPublicError(
  context: string,
  error: unknown,
  fallback: string,
  messagesByCode: PublicErrorMessagesByCode = {}
) {
  console.error(context, error);
  return getPublicErrorMessage(error, fallback, messagesByCode);
}
