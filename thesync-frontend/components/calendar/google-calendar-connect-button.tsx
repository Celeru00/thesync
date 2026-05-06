"use client";

import type { ComponentProps } from "react";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { startGoogleCalendarConnect } from "@/lib/auth/google-oauth";

type GoogleCalendarConnectButtonProps = {
  nextPath: string;
  label?: string;
} & ComponentProps<typeof Button>;

export function GoogleCalendarConnectButton({
  nextPath,
  label = "Connect Google Calendar",
  ...props
}: GoogleCalendarConnectButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setErrorMessage(null);
    setIsPending(true);

    const { error } = await startGoogleCalendarConnect({ nextPath });

    if (error) {
      console.error(error);
      setErrorMessage(
        "Google Calendar connection could not be started. Check your Supabase Google provider settings.",
      );
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        {...props}
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {isPending ? "Redirecting..." : label}
      </Button>

      {errorMessage ? (
        <p className="text-caption text-alert-error-body">{errorMessage}</p>
      ) : null}
    </div>
  );
}
