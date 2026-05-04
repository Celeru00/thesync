import { FileText } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function AdviserConsultationsPage() {
  return (
    <PortalPagePlaceholder
      badge="Adviser Consultations"
      title="Consultations"
      description="This page is ready for advisee request queues, meeting details, review status filters, and consultation actions that require adviser approval."
      pathLabel="/adviser/consultations"
      icon={FileText}
      primaryAction={{
        href: "/adviser/calendar",
        label: "Review schedule",
      }}
      secondaryAction={{
        href: "/adviser/notifications",
        label: "View notifications",
      }}
      notes={[
        "Request lists grouped by status and student",
        "Approve, reschedule, or decline consultation actions",
        "Meeting context and attached request metadata",
      ]}
    />
  );
}
