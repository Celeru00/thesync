import { Bell } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SettingsSection } from "@/components/settings/settings-section";

type NotificationPreference = {
  id: string;
  title: string;
  description: string;
};

type NotificationPreferencesProps = {
  preferences: NotificationPreference[];
};

export function NotificationPreferences({
  preferences,
}: NotificationPreferencesProps) {
  return (
    <SettingsSection
      title="Notification Preferences"
      description="Choose how you want to receive notifications"
      icon={Bell}
    >
      <div className="divide-y divide-border">
        {preferences.map((preference) => (
          <div
            key={preference.id}
            className="flex items-center justify-between gap-4 py-4 first:pt-0"
          >
            <div className="min-w-0">
              <Label htmlFor={preference.id}>{preference.title}</Label>
              <p className="mt-1 text-body-sm text-content-muted">
                {preference.description}
              </p>
            </div>
            <Switch id={preference.id} defaultChecked />
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-4">
        <Label htmlFor="reminder-time">Reminder Time</Label>
        <Select defaultValue="1-hour">
          <SelectTrigger id="reminder-time">
            <SelectValue placeholder="Select reminder time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15-minutes">15 minutes before</SelectItem>
            <SelectItem value="30-minutes">30 minutes before</SelectItem>
            <SelectItem value="1-hour">1 hour before</SelectItem>
            <SelectItem value="1-day">1 day before</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SettingsSection>
  );
}
