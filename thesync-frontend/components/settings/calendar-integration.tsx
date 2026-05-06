import { CalendarDays } from "lucide-react";

import type { GoogleCalendarConnectionStatus } from "@/lib/calendar/backend";
import { GoogleCalendarConnectButton } from "@/components/calendar/google-calendar-connect-button";
import { GoogleCalendarDisconnectButton } from "@/components/calendar/google-calendar-disconnect-button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSection } from "@/components/settings/settings-section";

type CalendarIntegrationProps = {
  email: string;
  connection: GoogleCalendarConnectionStatus;
  nextPath: string;
  statusMessage?: string | null;
};

export function CalendarIntegration({
  email,
  connection,
  nextPath,
  statusMessage,
}: CalendarIntegrationProps) {
  const isConnected = connection.connected;
  const connectedEmail = connection.google_email ?? email;

  return (
    <SettingsSection
      title="Calendar Integration"
      description="Manage your Google Calendar connection"
      icon={CalendarDays}
    >
      <div className="space-y-4">
        {statusMessage ? (
          <div className="rounded-lg border border-brand-subtle bg-primary-tint/40 px-4 py-3 text-body-sm text-content-strong">
            {statusMessage}
          </div>
        ) : null}

        <div
          className={`flex flex-col gap-4 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between ${
            isConnected
              ? "border border-emerald-200 bg-emerald-50"
              : "border border-brand-subtle bg-surface-card"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                isConnected
                  ? "bg-success-soft text-success"
                  : "bg-primary-tint text-brand"
              }`}
            >
              <CalendarDays className="size-5" />
            </div>
            <div>
              <p className="text-label">
                {isConnected
                  ? "Connected to Google Calendar"
                  : "Connect your Google Calendar"}
              </p>
              <p className="text-body-sm text-content-muted">
                {isConnected
                  ? connectedEmail
                  : "Connect your Google account to view and sync your personal calendar."}
              </p>
            </div>
          </div>
          {isConnected ? (
            <GoogleCalendarDisconnectButton className="rounded-lg" />
          ) : (
            <GoogleCalendarConnectButton
              nextPath={nextPath}
              className="rounded-lg"
            />
          )}
        </div>

        <div className="divide-y divide-border">
          <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
            <div>
              <Label htmlFor="auto-sync">Auto-sync Events</Label>
              <p className="mt-1 text-body-sm text-content-muted">
                Automatically add approved consultations to your calendar
              </p>
            </div>
            <Switch id="auto-sync" defaultChecked disabled={!isConnected} />
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <Label htmlFor="meet-links">Include Google Meet Links</Label>
              <p className="mt-1 text-body-sm text-content-muted">
                Generate meeting links for online consultations
              </p>
            </div>
            <Switch id="meet-links" defaultChecked disabled={!isConnected} />
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
