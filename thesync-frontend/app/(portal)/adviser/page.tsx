import { LayoutDashboard } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function AdviserDashboardPage() {
  return (
    <PortalPagePlaceholder
      badge="Adviser Dashboard"
      title="Dashboard"
      description="This is the shared dashboard entry point for the adviser portal. Use it for upcoming consultations, advisee requests, defense schedules, and quick status checks."
      pathLabel="/adviser"
      icon={LayoutDashboard}
      primaryAction={{
        href: "/adviser/consultations",
        label: "Open consultations",
      }}
      secondaryAction={{
        href: "/adviser/calendar",
        label: "Open calendar",
      }}
      notes={[
        "Upcoming student meetings and defense commitments",
        "Pending request queues that need adviser action",
        "Quick summaries for advisees, notifications, and schedule load",
      ]}
    />
  );
}
