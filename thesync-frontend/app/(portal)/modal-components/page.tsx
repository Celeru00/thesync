"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Info,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BaseModal } from "@/components/modals/base-modal";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";
import { ConsultationFormModal } from "@/components/modals/consultation-form-modal";
import { RejectionModal } from "@/components/modals/rejection-modal";
import { ScheduleDetailsModal } from "@/components/modals/schedule-details-modal";
import type { ScheduleDetail } from "@/types/modal";

const SAMPLE_SESSION: ScheduleDetail = {
  id: "1",
  title: "Chapter 1 Review",
  type: "Regular",
  status: "approved",
  date: "May 5, 2026",
  startTime: "2:00 PM",
  endTime: "3:00 PM",
  participants: [
    {
      id: "a",
      name: "Dr. Proceso L. Fernandez",
      role: "Adviser",
      email: "pfernandez@up.edu.ph",
    },
    {
      id: "b",
      name: "Gabby Bautista",
      role: "Student",
      email: "grbautista1@up.edu.ph",
    },
  ],
  topic: "Introduction and Background",
  description:
    "Review of the introduction chapter, research background, and problem statement. We will discuss the scope and limitations of the study.",
  location: "Room 301, DMPCS Building",
  meetLink: "https://meet.google.com/abc-defg-hij",
};

type ModalKey =
  | "base"
  | "destructive"
  | "success"
  | "warning"
  | "details"
  | "form"
  | "rejection";

export default function ModalComponentsPage() {
  const [open, setOpen] = useState<Partial<Record<ModalKey, boolean>>>({});

  function toggle(key: ModalKey, value: boolean) {
    setOpen((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-subheading">Modal Components</h1>
        <p className="text-body-sm">
          All modal and dialog components used throughout TheSync
        </p>
      </div>

      {/* Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Modal Inventory</CardTitle>
          <CardDescription>
            Complete list of all modal components and their use cases
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-label">Information Modals</p>
            {["Schedule Details Modal", "Basic Dialog", "Info Dialog"].map(
              (item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-brand" />
                  <p className="text-body-sm">{item}</p>
                </div>
              ),
            )}
          </div>
          <div className="space-y-2">
            <p className="text-label">Action Modals</p>
            {[
              "Quick Consultation Modal",
              "Alert Dialog (Destructive)",
              "Confirmation Dialog (Success)",
              "Warning Dialog",
              "Rejection Dialog",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-brand" />
                <p className="text-body-sm">{item}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 1 — Schedule Details */}
      <ModalSection
        number={1}
        title="Schedule Details Modal"
        subtitle="Full-screen modal for viewing consultation details"
        badge={<Badge variant="info">Summary</Badge>}
        usage="Used to display detailed information about a consultation or defense, including participants, date/time, location, and action buttons based on user role."
        features={[
          "Large layout (max-w-xl) for comprehensive information",
          "Color-coded status badges",
          "Participant cards with contact options (email, message)",
          "Meeting location and Google Meet link integration",
          "Scrollable content for long descriptions",
        ]}
      >
        <Button onClick={() => toggle("details", true)}>
          <Eye className="size-4" />
          View Schedule Details Modal
        </Button>
      </ModalSection>

      {/* Section 2 — Quick Consultation */}
      <ModalSection
        number={2}
        title="Quick Consultation Modal"
        subtitle="Modal for creating consultation requests"
        badge={<Badge variant="default">Form</Badge>}
        usage="Appears when user drags to select a time slot in the calendar week view. Pre-fills date and time, allowing quick consultation request creation."
        features={[
          "Auto-populated date and time from calendar selection",
          "Consultation type selection (Regular, Proposal Defense, Final Defense, Revision)",
          "Adviser selection dropdown",
          "Topic and description fields",
          "Form validation before submission",
        ]}
      >
        <Button onClick={() => toggle("form", true)}>
          <Plus className="size-4" />
          View Quick Consultation Modal
        </Button>
      </ModalSection>

      {/* Section 3 — Base Dialog */}
      <ModalSection
        number={3}
        title="Basic Dialog (Information)"
        subtitle="Standard dialog for displaying information or simple content"
        badge={<Badge variant="outline">Base</Badge>}
        usage="General-purpose dialog component for showing information, simple forms, or confirmations."
        features={[
          "Customisable size (default: max-w-lg)",
          "Header with title and description",
          "Scrollable content area",
          "Close button (X) in top-right",
          "Optional footer for action buttons",
          "Backdrop overlay with click-to-close",
        ]}
      >
        <Button variant="outline" onClick={() => toggle("base", true)}>
          <Info className="size-4" />
          View Basic Dialog
        </Button>
      </ModalSection>

      {/* Section 4 — Rejection Dialog */}
      <ModalSection
        number={4}
        title="Form Dialog"
        subtitle="Dialog with form inputs for data collection"
        badge={<Badge variant="default">Form</Badge>}
        usage="Used for collecting user input through forms without navigating to a new page."
        features={[
          "Textarea with character count validation",
          "Minimum character requirement (20 chars)",
          "Warning note for important context",
          "Submit disabled until requirement met",
          "Red/destructive submit styling",
        ]}
      >
        <Button variant="outline" onClick={() => toggle("rejection", true)}>
          <Plus className="size-4" />
          View Form Dialog
        </Button>
      </ModalSection>

      {/* Section 5 — Destructive */}
      <ModalSection
        number={5}
        title="Alert Dialog (Destructive Action)"
        subtitle="Modal for confirming destructive or important actions"
        badge={<Badge variant="destructive">Alert</Badge>}
        usage="Used for critical confirmations, especially before destructive actions like deleting data. Cannot be dismissed by clicking outside (must use Cancel or Confirm)."
        features={[
          "Modal overlay that requires explicit user choice",
          "Red/destructive styling for dangerous actions",
          "Clear title and description",
          "Two action buttons: Cancel and Confirm",
          "Keyboard accessible (Escape key blocked)",
        ]}
      >
        <Button
          variant="destructive"
          onClick={() => toggle("destructive", true)}
        >
          <Trash2 className="size-4" />
          Delete Item
        </Button>
      </ModalSection>

      {/* Section 6 — Success */}
      <ModalSection
        number={6}
        title="Confirmation Dialog (Success Action)"
        subtitle="Alert dialog for confirming positive actions"
        badge={<Badge variant="success">Confirm</Badge>}
        usage="Used to confirm important actions that are not destructive, such as approving requests or publishing content."
        features={[
          "Green/success styling for positive actions",
          "Confirmation required before proceeding",
          "Clear explanation of what will happen",
        ]}
      >
        <Button
          className="bg-success hover:bg-success/90 text-white"
          onClick={() => toggle("success", true)}
        >
          <CheckCircle2 className="size-4" />
          Approve Consultation
        </Button>
      </ModalSection>

      {/* Section 7 — Warning */}
      <ModalSection
        number={7}
        title="Warning Dialog"
        subtitle="Alert dialog for warning users about potential issues"
        badge={<Badge variant="warning">Warning</Badge>}
        usage="Used to warn users about actions that might have unintended consequences or require attention."
        features={[
          "Yellow/warning styling",
          "Important information highlighted",
          "Proceed with caution messaging",
        ]}
      >
        <Button
          variant="outline"
          className="border-warning text-warning hover:bg-warning-soft"
          onClick={() => toggle("warning", true)}
        >
          <AlertTriangle className="size-4" />
          Reschedule Consultation
        </Button>
      </ModalSection>

      {/* Implementation reference */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Reference</CardTitle>
          <CardDescription>
            How to use these modals in your code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-label">Base Components Location</p>
            {[
              "Dialog: components/ui/dialog.tsx",
              "BaseModal: components/modals/base-modal.tsx",
              "ConfirmationModal: components/modals/confirmation-modal.tsx",
              "ScheduleDetailsModal: components/modals/schedule-details-modal.tsx",
              "ConsultationFormModal: components/modals/consultation-form-modal.tsx",
              "RejectionModal: components/modals/rejection-modal.tsx",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <Layers className="mt-0.5 size-3.5 shrink-0 text-brand" />
                <p className="text-body-sm font-mono">{item}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Mounted modals ── */}
      <BaseModal
        open={open.base ?? false}
        onOpenChange={(v) => toggle("base", v)}
        title="Basic Information Dialog"
        description="This is a standard dialog for displaying information or simple content."
      >
        <p className="text-body-sm text-content-strong">
          This dialog can contain any content. It&apos;s useful for:
        </p>
        <ul className="mt-3 space-y-1">
          {[
            "Displaying important information",
            "Showing help or instructions",
            "Simple confirmations",
            "Quick forms or inputs",
          ].map((item) => (
            <li key={item} className="text-body-sm">
              {item}
            </li>
          ))}
        </ul>
      </BaseModal>

      <ConfirmationModal
        open={open.destructive ?? false}
        onOpenChange={(v) => toggle("destructive", v)}
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete the consultation request and remove all associated data from our servers."
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => {}}
      />

      <ConfirmationModal
        open={open.success ?? false}
        onOpenChange={(v) => toggle("success", v)}
        title="Approve this consultation request?"
        description="The student will be notified via email and the consultation will be added to both calendars. You can reschedule later if needed."
        variant="success"
        confirmLabel="Approve"
        onConfirm={() => {}}
      />

      <ConfirmationModal
        open={open.warning ?? false}
        onOpenChange={(v) => toggle("warning", v)}
        title="Reschedule this consultation?"
        description="This consultation is scheduled for tomorrow. Rescheduling now may cause conflicts with the student's schedule. Consider contacting them first before proceeding."
        variant="warning"
        confirmLabel="Proceed Anyway"
        onConfirm={() => {}}
      />

      <ScheduleDetailsModal
        open={open.details ?? false}
        onOpenChange={(v) => toggle("details", v)}
        session={SAMPLE_SESSION}
        onJoinMeeting={() => {}}
        onRequestReschedule={() => toggle("warning", true)}
      />

      <ConsultationFormModal
        open={open.form ?? false}
        onOpenChange={(v) => toggle("form", v)}
        date="Friday, May 8, 2026"
        timeRange="2:00 PM – 3:00 PM"
        onSubmit={() => {}}
      />

      <RejectionModal
        open={open.rejection ?? false}
        onOpenChange={(v) => toggle("rejection", v)}
        onReject={() => {}}
      />
    </div>
  );
}

function ModalSection({
  number,
  title,
  subtitle,
  badge,
  usage,
  features,
  children,
}: {
  number: number;
  title: string;
  subtitle: string;
  badge: React.ReactNode;
  usage: string;
  features: string[];
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>
              {number}. {title}
            </CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-label">Usage:</p>
          <p className="text-body-sm">{usage}</p>
        </div>
        <div className="space-y-2">
          <p className="text-label">Features:</p>
          <ul className="space-y-1">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                <p className="text-body-sm">{f}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-label">Preview:</p>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
