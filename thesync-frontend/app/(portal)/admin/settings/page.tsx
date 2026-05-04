import { Settings2 } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function AdminSettingsPage() {
  return (
    <PortalPagePlaceholder
      badge="Admin Settings"
      title="Settings"
      description="This route can hold platform configuration, role management settings, scheduling defaults, and other administrative controls for TheSync."
      pathLabel="/admin/settings"
      icon={Settings2}
      primaryAction={{
        href: "/admin",
        label: "Back to dashboard",
      }}
      secondaryAction={{
        href: "/admin/notifications",
        label: "Open notifications",
      }}
      notes={[
        "Role and access management controls",
        "System preferences for scheduling and coordination flows",
        "Administrative settings for notifications and platform behavior",
      ]}
    />
  );
}
