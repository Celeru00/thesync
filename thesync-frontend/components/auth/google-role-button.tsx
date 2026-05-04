"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import type { AppRole } from "@/lib/auth/profile";
import { startGoogleAuth } from "@/lib/auth/google-oauth";
import { Button } from "@/components/ui/button";

const toneClassNames = {
  student:
    "bg-linear-to-r from-[#3568EA] to-[#2D63E8] text-white hover:from-[#2E5ED8] hover:to-[#2757D6]",
  adviser:
    "bg-linear-to-r from-[#447FE2] to-[#3970CD] text-white hover:from-[#3C77D8] hover:to-[#3167BE]",
  admin:
    "bg-linear-to-r from-[#5D97E5] to-[#4E88D7] text-white hover:from-[#548FE0] hover:to-[#467FCB]",
} as const;

type GoogleRoleButtonProps = {
  label: string;
  role: AppRole;
  tone: keyof typeof toneClassNames;
};

export function GoogleRoleButton({ label, role, tone }: GoogleRoleButtonProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setErrorMessage(null);
    setIsPending(true);

    const { error } = await startGoogleAuth({
      flow: "login",
      role,
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
        className={`h-[3rem] w-full rounded-[0.95rem] justify-center gap-3 border-transparent text-[1.05rem] font-medium shadow-none ${toneClassNames[tone]}`}
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
