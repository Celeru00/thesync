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

type AdviserSettingsPageProps = {
  searchParams: Promise<{
    calendar?: string | string[];
  }>;
};

export default async function AdviserSettingsPage({
  searchParams,
}: AdviserSettingsPageProps) {
  const currentUser = await requireAppRole("adviser");
  const { authUser } = await getServerAuthState();
  const connection = await getServerGoogleCalendarConnection();
  const params = await searchParams;
  const calendarStatus = Array.isArray(params.calendar)
    ? params.calendar[0]
    : params.calendar;
  const facultyNumber =
    currentUser.identifier ??
    getAuthMetadataValue(
      authUser,
      "faculty_number",
      "facultyNumber",
      "faculty_id",
      "employee_id",
      "identifier",
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
    { label: "Account Type", value: "Adviser" },
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
        email={currentUser.email}
        identifierLabel="Faculty Number"
        identifierValue={facultyNumber}
        roleLabel="Adviser"
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
