import type { AppRole, SignupRole } from "@/lib/auth/profile";
import { getApiBaseUrl } from "@/lib/api/env";

export type AppSessionUser = {
  id: string;
  role_id: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  identifier: string | null;
  department: string | null;
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

function debugLog(event: string, data: Record<string, unknown>) {
  console.log(`[frontend-auth] ${event}`, data);
}

export async function fetchCurrentAppUser(
  accessToken: string,
): Promise<AppSessionUser | null> {
  debugLog("fetch_current_app_user_start", {
    hasAccessToken: Boolean(accessToken),
  });
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    debugLog("fetch_current_app_user_unauthorized", {
      status: response.status,
    });
    return null;
  }

  if (!response.ok) {
    debugLog("fetch_current_app_user_failed", {
      status: response.status,
    });
    throw await parseBackendAuthError(response);
  }

  debugLog("fetch_current_app_user_success", {
    status: response.status,
  });
  return (await response.json()) as AppSessionUser;
}

export async function initializeBackendAuth(
  accessToken: string,
  payload: {
    flow: "login" | "signup";
    requested_role?: AppRole | null;
  },
): Promise<AuthInitializeResponse> {
  debugLog("initialize_backend_auth_start", {
    flow: payload.flow,
    requestedRole: payload.requested_role ?? null,
    hasAccessToken: Boolean(accessToken),
  });
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
    debugLog("initialize_backend_auth_failed", {
      status: response.status,
    });
    throw await parseBackendAuthError(response);
  }

  debugLog("initialize_backend_auth_success", {
    status: response.status,
  });
  return (await response.json()) as AuthInitializeResponse;
}

export async function completeBackendRegistration(
  accessToken: string,
  payload: {
    role: SignupRole;
    full_name: string;
    email: string;
    avatar_url?: string | null;
    identifier: string;
    department: string;
  },
): Promise<AppSessionUser> {
  debugLog("complete_backend_registration_start", {
    role: payload.role,
    hasAccessToken: Boolean(accessToken),
  });
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    debugLog("complete_backend_registration_failed", {
      status: response.status,
    });
    throw await parseBackendAuthError(response);
  }

  debugLog("complete_backend_registration_success", {
    status: response.status,
  });
  return (await response.json()) as AppSessionUser;
}
