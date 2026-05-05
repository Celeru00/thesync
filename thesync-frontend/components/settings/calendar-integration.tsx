import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSection } from "@/components/settings/settings-section";

type CalendarIntegrationProps = {
  email: string;
};

export function CalendarIntegration({ email }: CalendarIntegrationProps) {
  return (
    <SettingsSection
      title="Calendar Integration"
      description="Manage your Google Calendar connection"
      icon={CalendarDays}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <p className="text-label">Connected to Google Calendar</p>
              <p className="text-body-sm text-content-muted">{email}</p>
            </div>
          </div>
          <Button type="button" variant="outline" className="rounded-lg">
            Disconnect
          </Button>
        </div>

        <div className="divide-y divide-border">
          <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
            <div>
              <Label htmlFor="auto-sync">Auto-sync Events</Label>
              <p className="mt-1 text-body-sm text-content-muted">
                Automatically add approved consultations to your calendar
              </p>
            </div>
            <Switch id="auto-sync" defaultChecked />
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <Label htmlFor="meet-links">Include Google Meet Links</Label>
              <p className="mt-1 text-body-sm text-content-muted">
                Generate meeting links for online consultations
              </p>
            </div>
            <Switch id="meet-links" defaultChecked />
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
