import { AccountInformation } from "@/components/settings/account-information";
import { CalendarIntegration } from "@/components/settings/calendar-integration";
import { DangerZone } from "@/components/settings/danger-zone";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { ProfileForm } from "@/components/settings/profile-form";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { getServerGoogleCalendarConnection } from "@/lib/calendar/server";
import { getCalendarStatusMessage } from "@/lib/calendar/messages";
import { getServerAuthState, requireAppRole } from "@/lib/auth/server";
import type { User } from "@supabase/supabase-js";

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

function formatSettingsDate(value: string | null | undefined) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatSettingsDateTime(value: string | null | undefined) {
  if (!value) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAuthMetadataValue(
  user: User | null,
  ...keys: string[]
): string | null {
  if (!user?.user_metadata || typeof user.user_metadata !== "object") {
    return null;
  }

  const metadata = user.user_metadata as Record<string, unknown>;

  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

type StudentSettingsPageProps = {
  searchParams: Promise<{
    calendar?: string | string[];
  }>;
};

export default async function StudentSettingsPage({
  searchParams,
}: StudentSettingsPageProps) {
  const currentUser = await requireAppRole("student");
  const { authUser } = await getServerAuthState();
  const connection = await getServerGoogleCalendarConnection();
  const params = await searchParams;
  const calendarStatus = Array.isArray(params.calendar)
    ? params.calendar[0]
    : params.calendar;
  const studentNumber =
    currentUser.identifier ??
    getAuthMetadataValue(
      authUser,
      "student_number",
      "studentNumber",
      "identifier",
    ) ??
    "Not available";
  const degreeProgram =
    currentUser.degree_program ??
    getAuthMetadataValue(
      authUser,
      "degree_program",
      "degreeProgram",
      "program",
    ) ??
    "Not available";
  const department =
    currentUser.department ??
    getAuthMetadataValue(
      authUser,
      "department",
      "department_code",
      "departmentCode",
    ) ??
    "Not available";
  const accountDetails = [
    { label: "Account Type", value: "Student" },
    {
      label: "Member Since",
      value: formatSettingsDate(currentUser.created_at),
    },
    {
      label: "Last Login",
      value: formatSettingsDateTime(authUser?.last_sign_in_at),
    },
    {
      label: "Calendar Sync",
      value: connection.connected ? "Connected" : "Not connected",
    },
  ];

  return (
    <SettingsLayout
      aside={
        <>
          <AccountInformation details={accountDetails} />
          <DangerZone />
        </>
      }
    >
      <ProfileForm
        departmentValue={department}
        degreeProgramValue={degreeProgram}
        email={currentUser.email}
        identifierLabel="Student Number"
        identifierValue={studentNumber}
        roleLabel="Student"
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
