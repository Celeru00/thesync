import {
  BookOpenText,
  Building2,
  IdCard,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { SettingsSection } from "@/components/settings/settings-section";
import { cn } from "@/lib/utils";

type ProfileFormProps = {
  departmentValue: string;
  degreeProgramValue?: string | null;
  email: string;
  identifierLabel: string;
  identifierValue: string;
  roleLabel: string;
};

function ProfileDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-surface bg-surface-card px-4 py-4">
      <div className="flex items-center gap-2 text-body-sm text-content-muted">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      <div className="mt-2 break-words text-body font-medium text-content-strong">
        {value}
      </div>
    </div>
  );
}

export function ProfileForm({
  departmentValue,
  degreeProgramValue,
  email,
  identifierLabel,
  identifierValue,
  roleLabel,
}: ProfileFormProps) {
  return (
    <SettingsSection
      title="Profile Information"
      description="Account details currently available in your TheSync profile"
      icon={UserRound}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <ProfileDetail icon={Mail} label="Email Address" value={email} />
        <ProfileDetail
          icon={ShieldCheck}
          label="Account Role"
          value={roleLabel}
        />
      </div>
      <div
        className={cn(
          "mt-4 grid gap-4",
          degreeProgramValue ? "md:grid-cols-2" : "md:grid-cols-1",
        )}
      >
        <ProfileDetail
          icon={IdCard}
          label={identifierLabel}
          value={identifierValue}
        />
        {degreeProgramValue ? (
          <ProfileDetail
            icon={BookOpenText}
            label="Degree Program"
            value={degreeProgramValue}
          />
        ) : null}
      </div>
      <div className="mt-4">
        <ProfileDetail
          icon={Building2}
          label="Department"
          value={departmentValue}
        />
      </div>
    </SettingsSection>
  );
}
