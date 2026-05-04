import { FileText } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function StudentConsultationsPage() {
  return (
    <PortalPagePlaceholder
      badge="Student Consultations"
      title="Consultations"
      description="This page is ready for consultation request lists, adviser details, request filters, meeting links, and reschedule actions."
      pathLabel="/student/consultations"
      icon={FileText}
      primaryAction={{
        href: "/student/calendar",
        label: "Review schedule",
      }}
      secondaryAction={{
        href: "/student/notifications",
        label: "View notifications",
      }}
      notes={[
        "Request status cards and filter controls",
        "Meeting actions such as join, reschedule, or cancel",
        "Consultation history and adviser-specific metadata",
      ]}
    />
  );
}
