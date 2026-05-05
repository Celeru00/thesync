import { CalendarDays, Clock, FileText, UserRound } from "lucide-react";

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

interface ConsultationSummary {
  type: string;
  adviser: string;
  date: string;
  time: string;
  topic: string;
}

interface ConsultationSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: ConsultationSummary;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function ConsultationSummaryModal({
  open,
  onOpenChange,
  summary,
  onConfirm,
  isSubmitting = false,
}: ConsultationSummaryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Consultation Request</DialogTitle>
          <DialogDescription>
            Please review your consultation details before submitting.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <SummaryRow
            icon={<FileText className="size-4 text-content-muted" />}
            label="Type"
            value={summary.type}
          />
          <SummaryRow
            icon={<UserRound className="size-4 text-content-muted" />}
            label="Adviser"
            value={summary.adviser}
          />
          <SummaryRow
            icon={<CalendarDays className="size-4 text-content-muted" />}
            label="Date"
            value={summary.date}
          />
          <SummaryRow
            icon={<Clock className="size-4 text-content-muted" />}
            label="Time"
            value={summary.time}
          />
          <SummaryRow
            icon={<FileText className="size-4 text-content-muted" />}
            label="Topic"
            value={summary.topic}
          />
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Confirm Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-surface px-4 py-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-caption text-content-muted">{label}</p>
        <p className="text-label">{value}</p>
      </div>
    </div>
  );
}
