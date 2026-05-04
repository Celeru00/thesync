import { Bell } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function AdminNotificationsPage() {
  return (
    <PortalPagePlaceholder
      badge="Admin Notifications"
      title="Notifications"
      description="Use this space for platform alerts, scheduling conflicts, workflow escalations, and other events that require administrative oversight."
      pathLabel="/admin/notifications"
      icon={Bell}
      primaryAction={{
        href: "/admin/consultations",
        label: "Open consultations",
      }}
      secondaryAction={{
        href: "/admin/settings",
        label: "Open settings",
      }}
      notes={[
        "Unread system and workflow alerts by severity",
        "Operational changes that affect advisers and students",
        "Delivery preferences for platform-level notifications",
      ]}
    />
  );
}
