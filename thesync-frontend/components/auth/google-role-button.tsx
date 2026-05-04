"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const toneClassNames = {
  student: "bg-[#3568EA] hover:bg-[#2E5ED8]",
  adviser: "bg-[#447FE2] hover:bg-[#3970CD]",
} as const;

type GoogleRoleButtonProps = {
  label: string;
  nextPath: string;
  tone: keyof typeof toneClassNames;
};

export function GoogleRoleButton({
  label,
  nextPath,
  tone,
}: GoogleRoleButtonProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setErrorMessage(null);
    setIsPending(true);

    const supabase = createClient();
    const redirectUrl = new URL("/auth/callback", window.location.origin);

    redirectUrl.searchParams.set("next", nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl.toString(),
      },
    });

    if (error) {
      console.error(error);
      setErrorMessage(
        "Google sign-in could not be started. Check your Supabase provider settings.",
      );
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        onClick={handleClick}
        disabled={isPending}
        className={`h-[3rem] w-full rounded-[0.95rem] justify-center gap-3 text-[1.05rem] font-medium shadow-none ${toneClassNames[tone]}`}
      >
        {isPending ? (
          <LoaderCircle className="size-5 animate-spin" />
        ) : (
          <span
            aria-hidden
            className="inline-flex items-center justify-center text-[1.45rem] leading-none font-semibold"
          >
            G
          </span>
        )}
        {isPending ? "Redirecting..." : label}
      </Button>

      {errorMessage ? (
        <p className="text-caption text-center text-alert-error-body">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
