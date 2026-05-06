"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

export function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      });

      const payload = (await response.json()) as
        | { message?: string }
        | { error_code?: string; message?: string };

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "We couldn't delete your account right now. Please try again.",
        );
        setIsDeleting(false);
        return;
      }

      try {
        const supabase = createClient();
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Ignore local sign-out failures after the backend account has been deleted.
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setErrorMessage(
        "We couldn't delete your account right now. Please try again.",
      );
      setIsDeleting(false);
    }
  }

  return (
    <>
      <SettingsSection title="Danger Zone" titleClassName="text-red-600">
        <div className="space-y-4">
          <p className="text-body-sm text-content-muted">
            Once you delete your account, all your data will be permanently
            removed and cannot be recovered.
          </p>
          <Button
            type="button"
            variant="destructive"
            className="w-full rounded-lg"
            onClick={() => {
              setErrorMessage(null);
              setOpen(true);
            }}
          >
            Delete Account
          </Button>
        </div>
      </SettingsSection>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg border border-brand-subtle bg-surface-card">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription className="text-content-muted">
              This permanently removes your TheSync account, profile, schedules,
              notifications, and connected calendar data.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="rounded-[1rem] border border-red-200 bg-red-50/80 px-4 py-4">
              <p className="text-body-sm text-red-700">
                This action cannot be undone. You will be signed out immediately
                after deletion.
              </p>
            </div>

            {errorMessage ? (
              <div className="rounded-[0.95rem] border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-lg"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting Account..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
