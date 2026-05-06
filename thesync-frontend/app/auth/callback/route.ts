import { NextResponse } from "next/server";

import { BackendAuthError, initializeBackendAuth } from "@/lib/auth/backend";
import { isAppRole, isSignupRole } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT_PATH = "/student";

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  return nextPath;
}

function getRegisterUrl(origin: string, requestedSignupRole: string | null) {
  const registerUrl = new URL("/register", origin);
  registerUrl.searchParams.set("flow", "signup");

  if (requestedSignupRole) {
    registerUrl.searchParams.set("role", requestedSignupRole);
  }

  return registerUrl;
}

function getLoginUrl(origin: string, errorCode: string) {
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", errorCode);
  return loginUrl;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const authError = requestUrl.searchParams.get("error");
  const authErrorCode = requestUrl.searchParams.get("error_code");
  const authErrorDescription = requestUrl.searchParams.get("error_description");
  const flow = requestUrl.searchParams.get("flow");
  const requestedRole = requestUrl.searchParams.get("role");
  const isSignupFlow = flow === "signup";
  const requestedSignupRole = isSignupRole(requestedRole)
    ? requestedRole
    : null;

  console.log("[frontend-auth] oauth_callback_received", {
    flow,
    requestedRole,
    hasCode: Boolean(code),
    authError,
    authErrorCode,
  });

  if (!code) {
    if (authError || authErrorCode) {
      console.log("[frontend-auth] oauth_callback_provider_error", {
        authError,
        authErrorCode,
        authErrorDescription,
      });

      return NextResponse.redirect(
        getLoginUrl(requestUrl.origin, "google-auth-failed"),
      );
    }

    return NextResponse.redirect(
      getLoginUrl(requestUrl.origin, "missing-code"),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.log("[frontend-auth] oauth_callback_exchange_failed", error);
    return NextResponse.redirect(
      getLoginUrl(requestUrl.origin, "google-auth-failed"),
    );
  }

  const [
    {
      data: { user },
      error: userError,
    },
    {
      data: { session },
    },
  ] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);

  if (userError || !user || !session?.access_token) {
    console.log("[frontend-auth] oauth_callback_missing_session", {
      userError,
      hasUser: Boolean(user),
      hasAccessToken: Boolean(session?.access_token),
    });
    return NextResponse.redirect(
      getLoginUrl(requestUrl.origin, "google-auth-failed"),
    );
  }

  try {
    const authState = await initializeBackendAuth(session.access_token, {
      flow: isSignupFlow ? "signup" : "login",
      requested_role: isAppRole(requestedRole) ? requestedRole : null,
    });

    console.log("[frontend-auth] oauth_callback_backend_result", authState);

    if (authState.action === "redirect") {
      return NextResponse.redirect(
        new URL(
          authState.redirect_to ??
            getSafeNextPath(requestUrl.searchParams.get("next")),
          requestUrl.origin,
        ),
      );
    }

    return NextResponse.redirect(
      getRegisterUrl(
        requestUrl.origin,
        authState.register_role ?? requestedSignupRole,
      ),
    );
  } catch (error) {
    if (error instanceof BackendAuthError) {
      console.log("[frontend-auth] oauth_callback_backend_failed", {
        code: error.code,
        status: error.status,
        message: error.message,
      });

      if (error.code === "admin-not-provisioned") {
        await supabase.auth.signOut();
      }

      return NextResponse.redirect(
        getLoginUrl(
          requestUrl.origin,
          error.code ?? "registration-sync-failed",
        ),
      );
    }

    throw error;
  }
}
