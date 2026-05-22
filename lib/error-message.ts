export function sanitizeErrorMessage(
  message: string | null | undefined,
  fallback = "Something went wrong."
) {
  if (!message) {
    return fallback;
  }

  const withoutScripts = message.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    " "
  );
  const withoutTags = withoutScripts.replace(/<[^>]+>/g, " ");
  const normalized = withoutTags.replace(/\s+/g, " ").trim();

  return normalized || fallback;
}
