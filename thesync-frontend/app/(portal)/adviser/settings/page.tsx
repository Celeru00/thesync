import { AccountForm } from "@/components/settings/account-form";
import { AccountInformation } from "@/components/settings/account-information";
import { CalendarIntegration } from "@/components/settings/calendar-integration";
import { DangerZone } from "@/components/settings/danger-zone";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { ProfileForm } from "@/components/settings/profile-form";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { getServerGoogleCalendarConnection } from "@/lib/calendar/server";
import { getCalendarStatusMessage } from "@/lib/calendar/messages";
import { requireAppRole } from "@/lib/auth/server";

const departments = [
  {
    value: "dmpcs",
    label: "Department of Mathematics, Physics, and Computer Science (DMPCS)",
  },
  {
    value: "cas",
    label: "Department of Food Science and Chemistry (DFSC)",
  },
  {
    value: "cp",
    label:
      "Department of Biological Sciences and Environmental Studies (DBSES)",
  },
];

const notificationPreferences = [
  {
    id: "adviser-email-notifications",
    title: "Email Notifications",
    description: "Receive email updates about consultation requests",
  },
  {
    id: "adviser-request-updates",
    title: "Request Updates",
    description: "Get notified when students submit or update requests",
  },
  {
    id: "adviser-session-reminders",
    title: "Session Reminders",
    description: "Receive reminders before scheduled sessions",
  },
  {
    id: "adviser-reschedule-notifications",
    title: "Reschedule Notifications",
    description: "Be notified when sessions are rescheduled",
  },
];

const accountDetails = [
  { label: "Account Type", value: "Adviser" },
  { label: "Member Since", value: "April 2026" },
  { label: "Last Login", value: "May 1, 2026" },
];

type AdviserSettingsPageProps = {
  searchParams: Promise<{
    calendar?: string | string[];
  }>;
};

export default async function AdviserSettingsPage({
  searchParams,
}: AdviserSettingsPageProps) {
  const currentUser = await requireAppRole("adviser");
  const connection = await getServerGoogleCalendarConnection();
  const params = await searchParams;
  const calendarStatus = Array.isArray(params.calendar)
    ? params.calendar[0]
    : params.calendar;

  return (
    <SettingsLayout
      aside={
        <>
          <AccountForm idPrefix="adviser-account" />
          <AccountInformation details={accountDetails} />
          <DangerZone />
        </>
      }
    >
      <ProfileForm
        idPrefix="adviser-profile"
        avatarDescription="Upload a square photo for your adviser profile."
        firstName="Maria"
        lastName="Santos"
        email="maria.santos@up.edu.ph"
        identifierLabel="Student/Employee ID"
        identifierValue="FAC-2026-001"
        departments={departments}
      />
      <NotificationPreferences preferences={notificationPreferences} />
      <CalendarIntegration
        email={currentUser.email}
        connection={connection}
        nextPath="/adviser/settings"
        statusMessage={getCalendarStatusMessage(calendarStatus)}
      />
    </SettingsLayout>
  );
}
