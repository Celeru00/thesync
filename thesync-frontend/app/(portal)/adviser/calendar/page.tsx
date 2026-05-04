import { CalendarDays } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function AdviserCalendarPage() {
  return (
    <PortalPagePlaceholder
      badge="Adviser Calendar"
      title="Calendar"
      description="Use this page for adviser schedule management, consultation slots, defense availability, and date-based filtering across advisee events."
      pathLabel="/adviser/calendar"
      icon={CalendarDays}
      primaryAction={{
        href: "/adviser",
        label: "Back to dashboard",
      }}
      secondaryAction={{
        href: "/adviser/consultations",
        label: "Open consultations",
      }}
      notes={[
        "Weekly and monthly scheduling views",
        "Availability blocks for consultation and defense sessions",
        "Reschedule actions connected to student requests",
      ]}
    />
  );
}
