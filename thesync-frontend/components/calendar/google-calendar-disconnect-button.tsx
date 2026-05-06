"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type GoogleCalendarDisconnectButtonProps = ComponentProps<typeof Button>;

export function GoogleCalendarDisconnectButton(
  props: GoogleCalendarDisconnectButtonProps,
) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setErrorMessage(null);
    setIsPending(true);

    const response = await fetch("/api/calendar/google/disconnect", {
      method: "POST",
    });

    if (!response.ok) {
      setErrorMessage(
        "Google Calendar could not be disconnected right now. Please try again.",
      );
      setIsPending(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={isPending}
        {...props}
      >
        {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {isPending ? "Disconnecting..." : "Disconnect"}
      </Button>

      {errorMessage ? (
        <p className="text-caption text-alert-error-body">{errorMessage}</p>
      ) : null}
    </div>
  );
}
