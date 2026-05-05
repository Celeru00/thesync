import { Camera, CircleUserRound, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection } from "@/components/settings/settings-section";

type DepartmentOption = {
  value: string;
  label: string;
};

type ProfileFormProps = {
  idPrefix: string;
  avatarDescription: string;
  firstName: string;
  lastName: string;
  email: string;
  identifierLabel: string;
  identifierValue: string;
  departmentValue?: string;
  departments: DepartmentOption[];
};

export function ProfileForm({
  idPrefix,
  avatarDescription,
  firstName,
  lastName,
  email,
  identifierLabel,
  identifierValue,
  departmentValue = "dmpcs",
  departments,
}: ProfileFormProps) {
  return (
    <SettingsSection
      title="Profile Information"
      description="Update your personal information and profile details"
      icon={UserRound}
    >
      <form className="space-y-6">
        <div className="flex flex-col gap-4 rounded-lg border border-dashed border-control bg-surface-muted-soft p-4 sm:flex-row sm:items-center">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <CircleUserRound className="size-10" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-label">Profile Photo</p>
            <p className="mt-1 text-body-sm text-content-muted">
              {avatarDescription}
            </p>
          </div>
          <Button type="button" variant="outline" className="rounded-lg">
            <Camera data-icon="inline-start" className="size-4" />
            Upload Avatar
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-first-name`}>First Name</Label>
            <Input id={`${idPrefix}-first-name`} defaultValue={firstName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-last-name`}>Last Name</Label>
            <Input id={`${idPrefix}-last-name`} defaultValue={lastName} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-email`}>Email Address</Label>
          <Input id={`${idPrefix}-email`} type="email" defaultValue={email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-identifier`}>{identifierLabel}</Label>
          <Input id={`${idPrefix}-identifier`} defaultValue={identifierValue} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-department`}>Department</Label>
          <Select defaultValue={departmentValue}>
            <SelectTrigger id={`${idPrefix}-department`}>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((department) => (
                <SelectItem key={department.value} value={department.value}>
                  {department.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" className="rounded-lg">
            Save Changes
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}
