import { NextResponse } from "next/server";

import {
  getAppUserWithRole,
  getDashboardPathForRole,
  isAppRole,
  isRegistrationComplete,
  isSignupRole,
} from "@/lib/auth/profile";
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

async function finalizeProvisionedSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: "student" | "adviser" | "admin",
) {
  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      app_role: role,
      registration_completed: true,
    },
  });

  if (metadataError) {
    return metadataError;
  }

  const { error: refreshError } = await supabase.auth.refreshSession();
  return refreshError;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const loginUrl = new URL("/login", requestUrl.origin);
  const flow = requestUrl.searchParams.get("flow");
  const requestedRole = requestUrl.searchParams.get("role");
  const isSignupFlow = flow === "signup";
  const requestedSignupRole = isSignupRole(requestedRole)
    ? requestedRole
    : null;

  if (!code) {
    loginUrl.searchParams.set("error", "missing-code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    loginUrl.searchParams.set("error", "google-auth-failed");
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    loginUrl.searchParams.set("error", "google-auth-failed");
    return NextResponse.redirect(loginUrl);
  }

  const registrationComplete = isRegistrationComplete(user);
  const { account, errorCode } = await getAppUserWithRole(supabase, user.id);

  if (errorCode) {
    if (isSignupFlow || requestedSignupRole) {
      return NextResponse.redirect(
        getRegisterUrl(requestUrl.origin, requestedSignupRole),
      );
    }

    if (requestedRole === "admin") {
      await supabase.auth.signOut();
      loginUrl.searchParams.set("error", "admin-not-provisioned");
      return NextResponse.redirect(loginUrl);
    }

    if (requestedRole && isSignupRole(requestedRole)) {
      return NextResponse.redirect(
        getRegisterUrl(requestUrl.origin, requestedRole),
      );
    }

    loginUrl.searchParams.set("error", errorCode);
    return NextResponse.redirect(loginUrl);
  }

  if (account) {
    if (!registrationComplete) {
      if (account.role === "admin") {
        if (requestedRole && requestedRole !== "admin") {
          loginUrl.searchParams.set("error", "role-mismatch");
          return NextResponse.redirect(loginUrl);
        }

        const finalizeError = await finalizeProvisionedSession(
          supabase,
          account.role,
        );

        if (finalizeError) {
          loginUrl.searchParams.set("error", "registration-sync-failed");
          return NextResponse.redirect(loginUrl);
        }

        return NextResponse.redirect(
          new URL(getDashboardPathForRole(account.role), requestUrl.origin),
        );
      }

      if (requestedRole === "admin") {
        await supabase.auth.signOut();
        loginUrl.searchParams.set("error", "admin-not-provisioned");
        return NextResponse.redirect(loginUrl);
      }

      const pendingSignupRole =
        requestedSignupRole ??
        (account.role === "student" || account.role === "adviser"
          ? account.role
          : null);

      return NextResponse.redirect(
        getRegisterUrl(requestUrl.origin, pendingSignupRole),
      );
    }

    if (isSignupFlow) {
      return NextResponse.redirect(
        getRegisterUrl(requestUrl.origin, requestedSignupRole),
      );
    }

    if (
      requestedRole &&
      isAppRole(requestedRole) &&
      requestedRole !== account.role
    ) {
      loginUrl.searchParams.set("error", "role-mismatch");
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.redirect(
      new URL(getDashboardPathForRole(account.role), requestUrl.origin),
    );
  }

  if (requestedRole === "admin") {
    await supabase.auth.signOut();
    loginUrl.searchParams.set("error", "admin-not-provisioned");
    return NextResponse.redirect(loginUrl);
  }

  if (isSignupFlow || requestedRole) {
    return NextResponse.redirect(
      getRegisterUrl(requestUrl.origin, requestedSignupRole),
    );
  }

  return NextResponse.redirect(
    new URL(
      getSafeNextPath(requestUrl.searchParams.get("next")),
      requestUrl.origin,
    ),
  );
}
