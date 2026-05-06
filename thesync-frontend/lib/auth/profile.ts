import type { User } from "@supabase/supabase-js";

export type AppRole = "student" | "adviser" | "admin";
export type SignupRole = Exclude<AppRole, "admin">;

type AuthPrefill = {
  email: string;
  firstName: string;
  lastName: string;
};

function getMetadataValue(
  metadata: Record<string, unknown>,
  key: string,
): string {
  const value = metadata[key];

  return typeof value === "string" ? value : "";
}

function getGoogleIdentityValue(user: User, key: string): string {
  const googleIdentity = user.identities?.find(
    (identity) => identity.provider === "google",
  );

  if (
    !googleIdentity?.identity_data ||
    typeof googleIdentity.identity_data !== "object"
  ) {
    return "";
  }

  const value = googleIdentity.identity_data[key];

  return typeof value === "string" ? value : "";
}

export function isAppRole(value: string | null | undefined): value is AppRole {
  return value === "student" || value === "adviser" || value === "admin";
}

export function isSignupRole(
  value: string | null | undefined,
): value is SignupRole {
  return value === "student" || value === "adviser";
}

export function getDashboardPathForRole(role: AppRole) {
  return {
    admin: "/admin",
    adviser: "/adviser",
    student: "/student",
  }[role];
}

export function getAuthAvatarUrl(user: User | null) {
  if (!user) {
    return null;
  }

  const metadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>)
      : {};

  return (
    getMetadataValue(metadata, "avatar_url") ||
    getMetadataValue(metadata, "picture") ||
    null
  );
}

export function getAuthPrefill(user: User | null): AuthPrefill {
  if (!user) {
    return {
      email: "",
      firstName: "",
      lastName: "",
    };
  }

  const metadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>)
      : {};

  return {
    email: user.email ?? "",
    firstName:
      getGoogleIdentityValue(user, "given_name") ||
      getMetadataValue(metadata, "given_name"),
    lastName:
      getGoogleIdentityValue(user, "family_name") ||
      getMetadataValue(metadata, "family_name"),
  };
}

export function buildFullName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}
