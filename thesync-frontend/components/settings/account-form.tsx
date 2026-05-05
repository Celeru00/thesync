import { LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "@/components/settings/settings-section";

type AccountFormProps = {
  idPrefix: string;
};

export function AccountForm({ idPrefix }: AccountFormProps) {
  return (
    <SettingsSection title="Security" icon={LockKeyhole}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-current-password`}>
            Current Password
          </Label>
          <Input
            id={`${idPrefix}-current-password`}
            type="password"
            placeholder="Enter current password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-new-password`}>New Password</Label>
          <Input
            id={`${idPrefix}-new-password`}
            type="password"
            placeholder="Enter new password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-confirm-password`}>
            Confirm Password
          </Label>
          <Input
            id={`${idPrefix}-confirm-password`}
            type="password"
            placeholder="Confirm new password"
          />
        </div>
        <Button type="button" variant="outline" className="w-full rounded-lg">
          Change Password
        </Button>
      </div>
    </SettingsSection>
  );
}
