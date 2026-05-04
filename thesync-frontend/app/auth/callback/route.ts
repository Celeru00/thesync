import { NextResponse } from "next/server";

import {
  getAppUserWithRole,
  getDashboardPathForRole,
  isAppRole,
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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const loginUrl = new URL("/login", requestUrl.origin);
  const flow = requestUrl.searchParams.get("flow");
  const requestedRole = requestUrl.searchParams.get("role");

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

  const { account, errorCode } = await getAppUserWithRole(supabase, user.id);

  if (errorCode) {
    if (flow === "signup" || isSignupRole(requestedRole)) {
      const registerUrl = new URL("/register", requestUrl.origin);

      if (isSignupRole(requestedRole)) {
        registerUrl.searchParams.set("role", requestedRole);
      }

      return NextResponse.redirect(registerUrl);
    }

    if (
      requestedRole &&
      isAppRole(requestedRole) &&
      requestedRole !== "admin"
    ) {
      return NextResponse.redirect(
        new URL(getDashboardPathForRole(requestedRole), requestUrl.origin),
      );
    }

    loginUrl.searchParams.set("error", errorCode);
    return NextResponse.redirect(loginUrl);
  }

  if (account) {
    return NextResponse.redirect(
      new URL(getDashboardPathForRole(account.role), requestUrl.origin),
    );
  }

  if (requestedRole === "admin") {
    loginUrl.searchParams.set("error", "admin-not-provisioned");
    return NextResponse.redirect(loginUrl);
  }

  if (flow === "signup" || requestedRole) {
    const registerUrl = new URL("/register", requestUrl.origin);

    if (isSignupRole(requestedRole)) {
      registerUrl.searchParams.set("role", requestedRole);
    }

    return NextResponse.redirect(registerUrl);
  }

  return NextResponse.redirect(
    new URL(
      getSafeNextPath(requestUrl.searchParams.get("next")),
      requestUrl.origin,
    ),
  );
}
