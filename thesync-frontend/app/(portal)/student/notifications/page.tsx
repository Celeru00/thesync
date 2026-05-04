import { Bell } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function StudentNotificationsPage() {
  return (
    <PortalPagePlaceholder
      badge="Student Notifications"
      title="Notifications"
      description="Use this page for reminders, approval updates, schedule changes, and other timeline-driven system messages."
      pathLabel="/student/notifications"
      icon={Bell}
      primaryAction={{
        href: "/student",
        label: "Return to dashboard",
      }}
      secondaryAction={{
        href: "/student/settings",
        label: "Manage preferences",
      }}
      notes={[
        "Unread and read notification sections",
        "Message severity, timestamps, and related deep links",
        "User preference toggles for email and in-app reminders",
      ]}
    />
  );
}
