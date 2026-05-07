import { redirect } from "next/navigation";
import { AlertCircle, CalendarDays } from "lucide-react";

import { GoogleRoleButton } from "@/components/auth/google-role-button";
import { GoogleSignupLink } from "@/components/auth/google-signup-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPublicServerAuthState } from "@/lib/auth/server";
import { getDashboardPathForRole } from "@/lib/auth/profile";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "google-auth-failed") {
    return "We couldn't sign you in. Use your UP Google account and try again.";
  }

  if (error === "domain-restricted") {
    return "Only Google accounts ending in @up.edu.ph are allowed.";
  }

  if (error === "missing-code") {
    return "Sign-in did not finish. Please try again.";
  }

  if (error === "account-lookup-failed") {
    return "We couldn't find your account. Try again or contact the team if this keeps happening.";
  }

  if (error === "role-lookup-failed") {
    return "We couldn't finish signing you in. Please try again.";
  }

  if (error === "role-not-supported") {
    return "This account can't sign in here yet.";
  }

  if (error === "registration-sync-failed") {
    return "We found your account, but couldn't finish signing you in. Please try again.";
  }

  if (error === "admin-not-provisioned") {
    return "This admin account is not ready to use yet. Please contact the team.";
  }

  if (error === "role-mismatch") {
    return "This Google account is already set up under a different role. Use the matching sign-in option to continue.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorCode = Array.isArray(params.error)
    ? params.error[0]
    : params.error;
  const errorMessage = getErrorMessage(errorCode);
  const { appUser, authUser } = await getPublicServerAuthState();

  if (!errorCode && appUser) {
    redirect(getDashboardPathForRole(appUser.app_role));
  }

  if (!errorCode && authUser) {
    redirect("/register?flow=signup");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-page text-page">
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-primary-tint/55 via-background to-background"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-[44%] size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-primary-tint via-white to-background opacity-90 blur-3xl"
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-[28rem] flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-3.5">
            <LogoMark />
            <div className="text-[2.1rem] leading-none font-semibold tracking-[-0.045em]">
              <span className="text-content-strong">The</span>
              <span className="text-brand">Sync</span>
            </div>
          </div>

          <p className="mb-8 text-[1.08rem] leading-8 text-content-muted">
            Sign in to your account
          </p>

          <div className="w-full overflow-hidden rounded-[1.45rem] border border-brand-subtle bg-surface-card/95 shadow-elevated backdrop-blur-sm">
            <div className="px-6 pt-7 pb-6">
              <h1 className="text-[2rem] leading-[1.1] font-semibold tracking-[-0.04em] text-content-strong">
                Welcome Back
              </h1>
              <p className="pt-1 text-[1.05rem] leading-7 text-content-muted">
                Choose your role to continue with your UP email
              </p>
            </div>

            {errorMessage ? (
              <div className="px-6 pb-3">
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Google sign-in failed</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              </div>
            ) : null}

            <div className="space-y-3 px-6 pb-3">
              <GoogleRoleButton
                label="Sign in as Student"
                role="student"
                tone="student"
              />
              <GoogleRoleButton
                label="Sign in as Adviser"
                role="adviser"
                tone="adviser"
              />
            </div>

            <div className="mt-3 h-px w-full bg-surface" />

            <div className="px-6 py-5 text-center text-[1rem] leading-7 text-content-muted">
              <GoogleSignupLink />
            </div>
          </div>
        </div>

        <div className="mt-20 space-y-1 text-center">
          <p className="text-[0.95rem] leading-6 text-content-muted">
            CMSC 186 - DMPCS, UP Mindanao
          </p>
          <p className="text-[0.9rem] leading-6 text-content-muted">
            &copy; 2026 TheSync
          </p>
        </div>
      </div>
    </main>
  );
}

function LogoMark() {
  return (
    <div className="flex size-[3.15rem] items-center justify-center rounded-[1rem] bg-brand text-brand-on shadow-glow">
      <CalendarDays className="size-[1.4rem]" />
    </div>
  );
}
