import { LayoutDashboard } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function StudentDashboardPage() {
  return (
    <PortalPagePlaceholder
      badge="Student Dashboard"
      title="Dashboard"
      description="This is the shared dashboard entry point for the student portal. Use it for upcoming schedules, request summaries, quick actions, and high-signal status updates."
      pathLabel="/student"
      icon={LayoutDashboard}
      primaryAction={{
        href: "/student/consultations",
        label: "Open consultations",
      }}
      secondaryAction={{
        href: "/student/calendar",
        label: "Open calendar",
      }}
      notes={[
        "Upcoming consultation and defense cards",
        "Deadline and notification summary panels",
        "Quick actions for new requests and scheduling tasks",
      ]}
    />
  );
}
