import { Button } from "@/components/ui/button";
import { SettingsSection } from "@/components/settings/settings-section";

export function DangerZone() {
  return (
    <SettingsSection title="Danger Zone" titleClassName="text-red-600">
      <div className="space-y-4">
        <p className="text-body-sm text-content-muted">
          Once you delete your account, all your data will be permanently
          removed and cannot be recovered.
        </p>
        <Button
          type="button"
          variant="destructive"
          className="w-full rounded-lg"
        >
          Delete Account
        </Button>
      </div>
    </SettingsSection>
  );
}
