import { Bell } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function AdviserNotificationsPage() {
  return (
    <PortalPagePlaceholder
      badge="Adviser Notifications"
      title="Notifications"
      description="Use this space for student request alerts, schedule changes, defense reminders, and other activity that needs timely adviser attention."
      pathLabel="/adviser/notifications"
      icon={Bell}
      primaryAction={{
        href: "/adviser/consultations",
        label: "Open consultations",
      }}
      secondaryAction={{
        href: "/adviser/settings",
        label: "Open settings",
      }}
      notes={[
        "Unread alerts grouped by priority and type",
        "Meeting updates and request status changes",
        "Delivery preferences for email and in-app notifications",
      ]}
    />
  );
}
