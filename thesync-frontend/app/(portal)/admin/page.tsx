import { LayoutDashboard } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function AdminDashboardPage() {
  return (
    <PortalPagePlaceholder
      badge="Admin Dashboard"
      title="Dashboard"
      description="This is the shared dashboard entry point for the admin portal. Use it for system-wide scheduling visibility, user management, consultation oversight, and operational summaries."
      pathLabel="/admin"
      icon={LayoutDashboard}
      primaryAction={{
        href: "/admin/consultations",
        label: "Open consultations",
      }}
      secondaryAction={{
        href: "/admin/calendar",
        label: "Open calendar",
      }}
      notes={[
        "Cross-role schedule and consultation summaries",
        "Operational alerts that need administrative action",
        "Quick access to system settings and user workflows",
      ]}
    />
  );
}
