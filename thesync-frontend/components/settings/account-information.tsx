import { Badge } from "@/components/ui/badge";
import { SettingsSection } from "@/components/settings/settings-section";

type AccountDetail = {
  label: string;
  value: string;
};

type AccountInformationProps = {
  details: AccountDetail[];
  status?: string;
};

export function AccountInformation({
  details,
  status = "Active",
}: AccountInformationProps) {
  return (
    <SettingsSection title="Account Information">
      <dl className="divide-y divide-border">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="flex items-center justify-between gap-4 py-3 first:pt-0"
          >
            <dt className="text-body-sm text-content-muted">{detail.label}</dt>
            <dd className="text-sm font-medium text-content-strong">
              {detail.value}
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 pt-3">
          <dt className="text-body-sm text-content-muted">Status</dt>
          <dd>
            <Badge variant="success" className="h-6 px-3">
              {status}
            </Badge>
          </dd>
        </div>
      </dl>
    </SettingsSection>
  );
}
