import { FileText } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function AdminConsultationsPage() {
  return (
    <PortalPagePlaceholder
      badge="Admin Consultations"
      title="Consultations"
      description="This page is ready for institution-level consultation oversight, request auditing, cross-role filtering, and administrative coordination actions."
      pathLabel="/admin/consultations"
      icon={FileText}
      primaryAction={{
        href: "/admin/calendar",
        label: "Review schedule",
      }}
      secondaryAction={{
        href: "/admin/notifications",
        label: "View notifications",
      }}
      notes={[
        "Consultation records grouped by role, status, or department",
        "Oversight actions for scheduling conflicts and workflow bottlenecks",
        "Administrative audit details tied to consultation history",
      ]}
    />
  );
}
