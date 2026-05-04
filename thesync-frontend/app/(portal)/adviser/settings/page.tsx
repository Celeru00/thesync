import { Settings2 } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function AdviserSettingsPage() {
  return (
    <PortalPagePlaceholder
      badge="Adviser Settings"
      title="Settings"
      description="This route can hold adviser profile settings, availability preferences, notification options, and portal-level controls for academic workflows."
      pathLabel="/adviser/settings"
      icon={Settings2}
      primaryAction={{
        href: "/adviser",
        label: "Back to dashboard",
      }}
      secondaryAction={{
        href: "/adviser/notifications",
        label: "Open notifications",
      }}
      notes={[
        "Availability windows and meeting preference controls",
        "Notification and reminder delivery settings",
        "Profile details and account-level portal options",
      ]}
    />
  );
}
