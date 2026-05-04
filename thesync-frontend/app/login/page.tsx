import Link from "next/link";
import { AlertCircle, CalendarDays } from "lucide-react";

import { GoogleRoleButton } from "@/components/auth/google-role-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "google-auth-failed") {
    return "Sign in failed. Use a @up.edu.ph Google account and try again.";
  }

  if (error === "missing-code") {
    return "Google sign-in did not complete. Try starting the login flow again.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorCode = Array.isArray(params.error)
    ? params.error[0]
    : params.error;
  const errorMessage = getErrorMessage(errorCode);

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
                Choose your role to continue
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
                nextPath="/student"
                tone="student"
              />
              <GoogleRoleButton
                label="Sign in as Adviser"
                nextPath="/adviser"
                tone="adviser"
              />
              <RoleButton label="Sign in as Admin" tone="admin" disabled />
            </div>

            <div className="mt-3 h-px w-full bg-surface" />

            <div className="px-6 py-5 text-center text-[1rem] leading-7 text-content-muted">
              <span>Don&apos;t have an account? </span>
              <Link
                href="/register"
                className="font-medium text-brand underline-offset-4 transition-colors hover:text-brand-strong hover:underline"
              >
                Register here
              </Link>
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

function RoleButton({
  label,
  tone,
  disabled = false,
}: {
  label: string;
  tone: "student" | "adviser" | "admin";
  disabled?: boolean;
}) {
  const toneClassName = {
    student: "bg-[#3568EA] hover:bg-[#2E5ED8]",
    adviser: "bg-[#447FE2] hover:bg-[#3970CD]",
    admin: "bg-[#5D97E5] hover:bg-[#4D87D8]",
  }[tone];

  return (
    <Button
      type="button"
      size="lg"
      disabled={disabled}
      className={`h-[3rem] w-full rounded-[0.95rem] justify-center gap-3 text-[1.05rem] font-medium shadow-none ${toneClassName}`}
    >
      <span
        aria-hidden
        className="inline-flex items-center justify-center text-[1.45rem] leading-none font-semibold"
      >
        G
      </span>
      {label}
    </Button>
  );
}

function LogoMark() {
  return (
    <div className="flex size-[3.15rem] items-center justify-center rounded-[1rem] bg-brand text-brand-on shadow-glow">
      <CalendarDays className="size-[1.4rem]" />
    </div>
  );
}
