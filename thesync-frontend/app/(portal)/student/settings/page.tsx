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
    id: "student-email-notifications",
    title: "Email Notifications",
    description: "Receive email updates about your consultations",
  },
  {
    id: "student-request-approvals",
    title: "Request Approvals",
    description: "Get notified when requests are approved or rejected",
  },
  {
    id: "student-session-reminders",
    title: "Session Reminders",
    description: "Receive reminders before scheduled sessions",
  },
  {
    id: "student-reschedule-notifications",
    title: "Reschedule Notifications",
    description: "Be notified when sessions are rescheduled",
  },
];

const accountDetails = [
  { label: "Account Type", value: "Student" },
  { label: "Member Since", value: "April 2026" },
  { label: "Last Login", value: "May 1, 2026" },
];

type StudentSettingsPageProps = {
  searchParams: Promise<{
    calendar?: string | string[];
  }>;
};

export default async function StudentSettingsPage({
  searchParams,
}: StudentSettingsPageProps) {
  const currentUser = await requireAppRole("student");
  const connection = await getServerGoogleCalendarConnection();
  const params = await searchParams;
  const calendarStatus = Array.isArray(params.calendar)
    ? params.calendar[0]
    : params.calendar;

  return (
    <SettingsLayout
      aside={
        <>
          <AccountForm idPrefix="student-account" />
          <AccountInformation details={accountDetails} />
          <DangerZone />
        </>
      }
    >
      <ProfileForm
        idPrefix="student-profile"
        avatarDescription="Upload a square photo for your student profile."
        firstName="John"
        lastName="Doe"
        email="john.doe@upm.edu"
        identifierLabel="Student/Employee ID"
        identifierValue="2020-12345"
        departments={departments}
      />
      <NotificationPreferences preferences={notificationPreferences} />
      <CalendarIntegration
        email={currentUser.email}
        connection={connection}
        nextPath="/student/settings"
        statusMessage={getCalendarStatusMessage(calendarStatus)}
      />
    </SettingsLayout>
  );
}
