"use client";

import { useState } from "react";

import { startGoogleAuth } from "@/lib/auth/google-oauth";

export function GoogleSignupLink() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setErrorMessage(null);
    setIsPending(true);

    const { error } = await startGoogleAuth({
      flow: "signup",
    });

    if (error) {
      console.error(error);
      setErrorMessage(
        "Google sign-up could not be started. Check your Supabase provider settings.",
      );
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-[1rem] leading-7 text-content-muted">
        <span>Don&apos;t have an account? </span>
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="font-medium text-brand underline-offset-4 transition-colors hover:text-brand-strong hover:underline disabled:cursor-not-allowed disabled:opacity-70"
        >
          Register here
        </button>
      </div>

      {errorMessage ? (
        <p className="text-caption text-center text-alert-error-body">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
