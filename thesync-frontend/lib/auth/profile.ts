import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AppRole = "student" | "adviser" | "admin";
export type SignupRole = Exclude<AppRole, "admin">;

export type AppUserRecord = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role_id: number;
};

export type AppUserAccount = AppUserRecord & {
  role: AppRole;
};

export type RoleRecord = {
  id: number;
  name: string;
};

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

const roleAliases = {
  admin: ["admin", "administrator"],
  adviser: ["adviser", "advisor"],
  student: ["student"],
} as const satisfies Record<AppRole, readonly string[]>;

function normalizeRoleName(value: string | null | undefined): AppRole | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  for (const [role, aliases] of Object.entries(roleAliases) as Array<
    [AppRole, readonly string[]]
  >) {
    if (aliases.includes(normalizedValue)) {
      return role;
    }
  }

  return null;
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

export function isRegistrationComplete(user: User | null) {
  if (!user) {
    return false;
  }

  const metadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>)
      : {};

  return metadata.registration_completed === true;
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

export async function getRoleByName(
  supabase: SupabaseClient,
  roleName: SignupRole | AppRole,
) {
  const { data, error } = await supabase.from("roles").select("id, name");

  if (error) {
    return {
      data: null,
      error,
    };
  }

  const matchingRole =
    (data as RoleRecord[]).find(
      (role) => normalizeRoleName(role.name) === roleName,
    ) ?? null;

  return {
    data: matchingRole,
    error: null,
  };
}

export async function getAppUserWithRole(
  supabase: SupabaseClient,
  authUserId: string,
) {
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, role_id")
    .eq("id", authUserId)
    .maybeSingle();

  if (userError) {
    return {
      account: null,
      errorCode: "account-lookup-failed" as const,
    };
  }

  if (!userRow) {
    return {
      account: null,
      errorCode: null,
    };
  }

  const account = userRow as Pick<AppUserRecord, "id" | "role_id">;
  const { data: roleRow, error: roleError } = await supabase
    .from("roles")
    .select("id, name")
    .eq("id", account.role_id)
    .maybeSingle();

  if (roleError || !roleRow) {
    return {
      account: null,
      errorCode: "role-lookup-failed" as const,
    };
  }

  const normalizedRole = normalizeRoleName(roleRow.name);

  if (!normalizedRole) {
    return {
      account: null,
      errorCode: "role-not-supported" as const,
    };
  }

  return {
    account: {
      ...account,
      role: normalizedRole,
    } as AppUserAccount,
    errorCode: null,
  };
}
