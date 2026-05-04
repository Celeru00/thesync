import { CalendarDays } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function StudentCalendarPage() {
  return (
    <PortalPagePlaceholder
      badge="Student Calendar"
      title="Calendar"
      description="Use this page for the student schedule view, date-based filters, event detail panels, and available time windows for consultations or defenses."
      pathLabel="/student/calendar"
      icon={CalendarDays}
      primaryAction={{
        href: "/student",
        label: "Back to dashboard",
      }}
      secondaryAction={{
        href: "/student/consultations",
        label: "Open consultations",
      }}
      notes={[
        "Monthly and agenda scheduling views",
        "Availability markers and event detail drawers",
        "Reschedule flows connected to consultation records",
      ]}
    />
  );
}
