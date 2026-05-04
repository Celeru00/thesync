"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdviserOption, ConsultationFormValues, ConsultationType } from "@/types/modal";

const CONSULTATION_TYPES: ConsultationType[] = [
  "Regular",
  "Proposal Defense",
  "Final Defense",
  "Revision",
];

const MOCK_ADVISERS: AdviserOption[] = [
  { id: "1", name: "Dr. Jasmine A. Malin", department: "DMPCS" },
  { id: "2", name: "Dr. Proceso L. Fernandez", department: "DMPCS" },
  { id: "3", name: "Dr. Lemuel Clark P. Velasco", department: "DMPCS" },
];

interface ConsultationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date?: string;
  timeRange?: string;
  onSubmit: (data: ConsultationFormValues) => void;
}

const EMPTY_FORM: ConsultationFormValues = {
  type: "Regular",
  adviserId: "",
  topic: "",
  description: "",
};

export function ConsultationFormModal({
  open,
  onOpenChange,
  date,
  timeRange,
  onSubmit,
}: ConsultationFormModalProps) {
  const [form, setForm] = useState<ConsultationFormValues>(EMPTY_FORM);

  function handleSubmit() {
    onSubmit(form);
    setForm(EMPTY_FORM);
    onOpenChange(false);
  }

  const canSubmit = form.adviserId !== "" && form.topic.trim() !== "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setForm(EMPTY_FORM);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Consultation Request</DialogTitle>
          <DialogDescription>
            Schedule a new consultation for the selected time slot
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Date + Time summary */}
          {(date ?? timeRange) && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-info-soft bg-info-soft/30 px-4 py-3">
              {date && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 shrink-0 text-info" />
                  <div>
                    <p className="text-caption text-content-muted">Date</p>
                    <p className="text-label">{date}</p>
                  </div>
                </div>
              )}
              {timeRange && (
                <div className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0 text-info" />
                  <div>
                    <p className="text-caption text-content-muted">Time</p>
                    <p className="text-label">{timeRange}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Consultation Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="size-4 text-content-muted" />
              Consultation Type
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, type: v as ConsultationType }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONSULTATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Adviser */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <UserRound className="size-4 text-content-muted" />
              Select Adviser
            </Label>
            <Select
              value={form.adviserId}
              onValueChange={(v) => setForm((f) => ({ ...f, adviserId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an adviser" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_ADVISERS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}{" "}
                    <span className="text-content-muted">({a.department})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label>Topic / Title</Label>
            <Input
              placeholder="Chapter 1 Review"
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description / Agenda</Label>
            <Textarea
              placeholder="Provide details about what you'd like to discuss during this consultation…"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Create Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
