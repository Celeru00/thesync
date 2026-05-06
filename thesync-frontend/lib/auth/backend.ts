import type { AppRole, SignupRole } from "@/lib/auth/profile";
import { getApiBaseUrl } from "@/lib/api/env";

export type AppSessionUser = {
  id: string;
  role_id: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  app_role: AppRole;
};

export type AuthInitializeResponse = {
  action: "redirect" | "register";
  redirect_to: string | null;
  register_role: SignupRole | null;
};

export class BackendAuthError extends Error {
  code: string | null;
  status: number;

  constructor(
    message: string,
    options: { code?: string | null; status: number },
  ) {
    super(message);
    this.name = "BackendAuthError";
    this.code = options.code ?? null;
    this.status = options.status;
  }
}

async function parseBackendAuthError(response: Response) {
  let errorCode: string | null = null;
  let message = "We couldn't finish signing you in. Please try again.";

  try {
    const payload = (await response.json()) as {
      detail?: string | { error_code?: string; message?: string };
    };

    if (typeof payload.detail === "string") {
      message = payload.detail;
    } else if (payload.detail) {
      errorCode = payload.detail.error_code ?? null;
      message = payload.detail.message ?? message;
    }
  } catch {
    // Ignore parse failures and fall back to the generic message.
  }

  return new BackendAuthError(message, {
    code: errorCode,
    status: response.status,
  });
}

export async function fetchCurrentAppUser(
  accessToken: string,
): Promise<AppSessionUser | null> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw await parseBackendAuthError(response);
  }

  return (await response.json()) as AppSessionUser;
}

export async function initializeBackendAuth(
  accessToken: string,
  payload: {
    flow: "login" | "signup";
    requested_role?: AppRole | null;
  },
): Promise<AuthInitializeResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseBackendAuthError(response);
  }

  return (await response.json()) as AuthInitializeResponse;
}

export async function completeBackendRegistration(
  accessToken: string,
  payload: {
    role: SignupRole;
    full_name: string;
    email: string;
    avatar_url?: string | null;
  },
): Promise<AppSessionUser> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseBackendAuthError(response);
  }

  return (await response.json()) as AppSessionUser;
}
