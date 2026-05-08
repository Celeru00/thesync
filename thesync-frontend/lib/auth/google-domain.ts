const DEFAULT_ALLOWED_GOOGLE_EMAIL_DOMAIN = "up.edu.ph";

function normalizeAllowedGoogleEmailDomain(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return normalized.startsWith("@") ? normalized.slice(1) : normalized;
}

const allowedGoogleEmailDomain =
  normalizeAllowedGoogleEmailDomain(
    process.env.NEXT_PUBLIC_ALLOWED_GOOGLE_EMAIL_DOMAIN,
  ) ??
  (process.env.NODE_ENV === "development"
    ? null
    : DEFAULT_ALLOWED_GOOGLE_EMAIL_DOMAIN);

export function getAllowedGoogleEmailDomain() {
  return allowedGoogleEmailDomain;
}

export function getAllowedGoogleEmailSuffix() {
  return allowedGoogleEmailDomain ? `@${allowedGoogleEmailDomain}` : null;
}

export function isAllowedGoogleEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const allowedSuffix = getAllowedGoogleEmailSuffix();

  if (!allowedSuffix) {
    return Boolean(normalizedEmail);
  }

  return normalizedEmail.endsWith(allowedSuffix);
}
