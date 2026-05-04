"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MIN_CHARS = 20;

interface RejectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (reason: string) => void;
}

export function RejectionModal({
  open,
  onOpenChange,
  onReject,
}: RejectionModalProps) {
  const [reason, setReason] = useState("");

  const charCount = reason.trim().length;
  const canSubmit = charCount >= MIN_CHARS;

  function handleReject() {
    onReject(reason.trim());
    setReason("");
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject Consultation Request</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this consultation. The student
            will receive this feedback.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="space-y-2">
            <Label>Reason for Rejection</Label>
            <Textarea
              placeholder="Please explain why this consultation cannot be scheduled…"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-caption text-content-muted">
              {charCount < MIN_CHARS
                ? `Minimum ${MIN_CHARS} characters required`
                : `${charCount} characters`}
            </p>
          </div>

          {/* Warning note */}
          <div className="flex items-start gap-3 rounded-xl border border-warning-soft bg-warning-soft px-4 py-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-body-sm text-content-strong">
              <strong>Note:</strong> The student will be notified via email with
              your feedback. Consider suggesting alternative dates if possible.
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!canSubmit}
            onClick={handleReject}
          >
            Reject Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
