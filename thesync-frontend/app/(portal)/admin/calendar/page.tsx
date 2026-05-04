import { CalendarDays } from "lucide-react";

import { PortalPagePlaceholder } from "@/components/app/portal-page-placeholder";

export default function AdminCalendarPage() {
  return (
    <PortalPagePlaceholder
      badge="Admin Calendar"
      title="Calendar"
      description="Use this page for institution-wide scheduling visibility, defense date coordination, consultation oversight, and date-based administrative filtering."
      pathLabel="/admin/calendar"
      icon={CalendarDays}
      primaryAction={{
        href: "/admin",
        label: "Back to dashboard",
      }}
      secondaryAction={{
        href: "/admin/consultations",
        label: "Open consultations",
      }}
      notes={[
        "Global schedule views across roles and rooms",
        "Administrative visibility into defense and consultation load",
        "Date filters for operational planning and coordination",
      ]}
    />
  );
}
