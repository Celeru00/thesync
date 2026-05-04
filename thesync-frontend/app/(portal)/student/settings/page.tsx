import { Settings2 } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function StudentSettingsPage() {
  return (
    <PortalPagePlaceholder
      badge="Student Settings"
      title="Settings"
      description="This route can hold profile preferences, notification settings, account controls, and any portal-level configuration that should persist across student workflows."
      pathLabel="/student/settings"
      icon={Settings2}
      primaryAction={{
        href: "/student/notifications",
        label: "View notifications",
      }}
      secondaryAction={{
        href: "/student",
        label: "Return to dashboard",
      }}
      notes={[
        "Profile and contact preference forms",
        "Notification channels and reminder timing controls",
        "Account security actions and session management",
      ]}
    />
  );
}
