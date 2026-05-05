"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  GraduationCap,
  UserRound,
} from "lucide-react";

import {
  buildFullName,
  getAuthAvatarUrl,
  getDashboardPathForRole,
  getRoleByName,
  type SignupRole,
} from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/client";
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
import { cn } from "@/lib/utils";

type SignupStep = 1 | 2 | 3;

type RoleConfig = {
  title: string;
  description: string;
  features: string[];
  identifierLabel: string;
  identifierPlaceholder: string;
  departmentLabel: string;
  icon: typeof GraduationCap;
};

const roleConfigs: Record<SignupRole, RoleConfig> = {
  student: {
    title: "Student",
    description: "Request consultations and track your thesis progress",
    features: [
      "Schedule consultations",
      "Track thesis milestones",
      "Receive notifications",
    ],
    identifierLabel: "Student Number",
    identifierPlaceholder: "2020-12345",
    departmentLabel: "Department",
    icon: GraduationCap,
  },
  adviser: {
    title: "Adviser",
    description: "Manage consultations and guide your advisees",
    features: [
      "Review requests",
      "Manage availability",
      "Track advisee progress",
    ],
    identifierLabel: "Faculty ID",
    identifierPlaceholder: "2014-0042",
    departmentLabel: "Department",
    icon: BookOpen,
  },
};

const departmentOptions = [
  "Department of Mathematics, Physics, and Computer Science",
  "Department of Food Science and Chemistry",
  "Department of Biological Sciences and Environmental Studies",
] as const;

function isValidUpEmail(email: string) {
  return email.trim().toLowerCase().endsWith("@up.edu.ph");
}

export function RegisterFlow({
  initialRole = null,
  initialPrefill = {
    email: "",
    firstName: "",
    lastName: "",
  },
}: {
  initialRole?: SignupRole | null;
  initialPrefill?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}) {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>(() => {
    if (initialPrefill.email && initialRole) {
      return 3;
    }

    if (initialPrefill.email) {
      return 2;
    }

    return 1;
  });
  const [email, setEmail] = useState(initialPrefill.email);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<SignupRole | null>(initialRole);
  const [profile, setProfile] = useState({
    firstName: initialPrefill.firstName,
    lastName: initialPrefill.lastName,
    identifier: "",
    department: "",
  });

  const roleConfig = role ? roleConfigs[role] : null;
  const canContinueFromEmail = email.trim().length > 0;
  const canContinueFromRole = role !== null;
  const canCreateAccount =
    role !== null &&
    profile.firstName.trim().length > 0 &&
    profile.lastName.trim().length > 0 &&
    profile.identifier.trim().length > 0 &&
    profile.department.trim().length > 0;

  function handleEmailContinue() {
    if (!isValidUpEmail(email)) {
      setEmailError("Email must end with @up.edu.ph");
      return;
    }

    setEmailError(null);
    setStep(2);
  }

  async function handleCreateAccount() {
    if (!canCreateAccount) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !role) {
      setSubmitError(
        "Your Google session is missing. Start the sign-up flow again from login.",
      );
      setIsSubmitting(false);
      return;
    }

    const { data: roleRow, error: roleError } = await getRoleByName(
      supabase,
      role,
    );

    if (roleError || !roleRow) {
      console.error(roleError);
      setSubmitError(
        "Your role could not be resolved. Check the roles table and try again.",
      );
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("users").upsert(
      {
        avatar_url: getAuthAvatarUrl(user),
        email: user.email ?? email.trim(),
        full_name: buildFullName(profile.firstName, profile.lastName),
        id: user.id,
        role_id: roleRow.id,
      },
      {
        onConflict: "id",
      },
    );

    if (error) {
      console.error(error);
      setSubmitError(
        "Your account details could not be saved. Confirm the users and roles tables are configured in Supabase.",
      );
      setIsSubmitting(false);
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        app_role: role,
        registration_completed: true,
      },
    });

    if (metadataError) {
      console.error(metadataError);
      setSubmitError(
        "Your account was created, but the session could not be finalized. Try signing in again.",
      );
      setIsSubmitting(false);
      return;
    }

    const { error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      console.error(refreshError);
      setSubmitError(
        "Your account was created, but the session could not be refreshed. Try signing in again.",
      );
      setIsSubmitting(false);
      return;
    }

    router.replace(getDashboardPathForRole(role));
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-page text-page">
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-primary-tint/55 via-background to-background"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-[44%] size-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-primary-tint via-white to-background opacity-90 blur-3xl"
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-[56rem] flex-col items-center text-center md:-translate-y-8 lg:-translate-y-10">
          <div className="mb-4 flex items-center gap-3.5">
            <LogoMark />
            <div className="text-[2.1rem] leading-none font-semibold tracking-[-0.045em]">
              <span className="text-content-strong">The</span>
              <span className="text-brand">Sync</span>
            </div>
          </div>

          <p className="mb-8 text-[1.08rem] leading-8 text-content-muted">
            Create your account to get started
          </p>

          <SignupStepper currentStep={step} />

          <div className="mt-10 w-full rounded-[1.75rem] border border-brand-subtle bg-surface-card/95 px-6 py-6 shadow-elevated backdrop-blur-sm sm:px-8 sm:py-8">
            {step === 1 ? (
              <EmailStep
                email={email}
                emailError={emailError}
                onEmailChange={(value) => {
                  setEmail(value);
                  if (emailError) {
                    setEmailError(null);
                  }
                }}
                onContinue={handleEmailContinue}
                canContinue={canContinueFromEmail}
              />
            ) : null}

            {step === 2 ? (
              <RoleStep
                role={role}
                onRoleSelect={setRole}
                onBack={() => setStep(1)}
                onContinue={() => setStep(3)}
                canContinue={canContinueFromRole}
              />
            ) : null}

            {step === 3 && role && roleConfig ? (
              <ProfileStep
                email={email}
                role={role}
                roleConfig={roleConfig}
                profile={profile}
                onProfileChange={(field, value) =>
                  setProfile((current) => ({
                    ...current,
                    [field]: value,
                  }))
                }
                onBack={() => setStep(2)}
                onCreateAccount={handleCreateAccount}
                canCreateAccount={canCreateAccount}
                submitError={submitError}
                isSubmitting={isSubmitting}
              />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

function EmailStep({
  email,
  emailError,
  onEmailChange,
  onContinue,
  canContinue,
}: {
  email: string;
  emailError: string | null;
  onEmailChange: (value: string) => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <h1 className="text-[2rem] leading-[1.12] font-semibold tracking-[-0.04em] text-content-strong">
          Verify Your UP Email
        </h1>
        <p className="text-[1.05rem] leading-7 text-content-muted">
          You&apos;ll need a valid @up.edu.ph email address to register
        </p>
      </div>

      <div className="space-y-5 text-left">
        <div className="space-y-2.5">
          <Label
            htmlFor="signup-email"
            className="text-[1.05rem] font-medium text-content-strong"
          >
            UP Email Address
          </Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="your.name@up.edu.ph"
            aria-invalid={emailError ? "true" : "false"}
            className="h-12 rounded-[0.95rem] text-base"
          />
        </div>

        {emailError ? (
          <div className="flex items-center gap-3 rounded-[0.95rem] border border-alert-error bg-alert-error px-4 py-3 text-left">
            <CircleAlert className="size-4 text-alert-error" />
            <p className="text-body-sm text-alert-error-body">{emailError}</p>
          </div>
        ) : null}

        <div className="rounded-[0.95rem] border border-card-info bg-card-info px-4 py-4 text-left">
          <p className="text-body text-card-info">
            <span className="font-semibold">Why @up.edu.ph?</span> TheSync is
            exclusively for the UP community to ensure secure and verified
            access.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-12 flex-1 rounded-[0.95rem] border-control bg-surface-card text-content-strong shadow-none hover:bg-surface-muted"
        >
          <Link href="/login">Back to Login</Link>
        </Button>
        <PrimaryActionButton
          disabled={!canContinue}
          onClick={onContinue}
          label="Continue"
        />
      </div>
    </section>
  );
}

function RoleStep({
  role,
  onRoleSelect,
  onBack,
  onContinue,
  canContinue,
}: {
  role: SignupRole | null;
  onRoleSelect: (role: SignupRole) => void;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
}) {
  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <h1 className="text-[2rem] leading-[1.12] font-semibold tracking-[-0.04em] text-content-strong">
          Select Your Role
        </h1>
        <p className="text-[1.05rem] leading-7 text-content-muted">
          Choose the role that best describes your position
        </p>
      </div>

      <div className="grid gap-4 text-left md:grid-cols-2">
        {(Object.entries(roleConfigs) as Array<[SignupRole, RoleConfig]>).map(
          ([value, config]) => (
            <RoleCard
              key={value}
              role={value}
              selected={role === value}
              onSelect={onRoleSelect}
              config={config}
            />
          ),
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          className="h-12 flex-1 rounded-[0.95rem] border-control bg-surface-card text-content-strong shadow-none hover:bg-surface-muted"
        >
          Back
        </Button>
        <PrimaryActionButton
          disabled={!canContinue}
          onClick={onContinue}
          label="Continue"
        />
      </div>
    </section>
  );
}

function ProfileStep({
  email,
  role,
  roleConfig,
  profile,
  onProfileChange,
  onBack,
  onCreateAccount,
  canCreateAccount,
  submitError,
  isSubmitting,
}: {
  email: string;
  role: SignupRole;
  roleConfig: RoleConfig;
  profile: {
    firstName: string;
    lastName: string;
    identifier: string;
    department: string;
  };
  onProfileChange: (
    field: "firstName" | "lastName" | "identifier" | "department",
    value: string,
  ) => void;
  onBack: () => void;
  onCreateAccount: () => void;
  canCreateAccount: boolean;
  submitError: string | null;
  isSubmitting: boolean;
}) {
  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <h1 className="text-[2rem] leading-[1.12] font-semibold tracking-[-0.04em] text-content-strong">
          Complete Your Profile
        </h1>
        <p className="text-[1.05rem] leading-7 text-content-muted">
          Provide your details to finish setting up your account
        </p>
      </div>

      <div className="space-y-5 text-left">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="signup-first-name"
            label="First Name"
            value={profile.firstName}
            onChange={(value) => onProfileChange("firstName", value)}
            placeholder={
              role === "student" ? "Gabrielle Xiane" : "Maria Cristina"
            }
          />
          <Field
            id="signup-last-name"
            label="Last Name"
            value={profile.lastName}
            onChange={(value) => onProfileChange("lastName", value)}
            placeholder={role === "student" ? "Bautista" : "Dela Cruz"}
          />
        </div>

        <Field
          id="signup-identifier"
          label={roleConfig.identifierLabel}
          value={profile.identifier}
          onChange={(value) => onProfileChange("identifier", value)}
          placeholder={roleConfig.identifierPlaceholder}
        />

        <Field
          id="signup-department"
          label={roleConfig.departmentLabel}
          value={profile.department}
          onChange={(value) => onProfileChange("department", value)}
          options={departmentOptions}
          placeholder="Select your department"
        />

        <div className="rounded-[1rem] border border-surface bg-surface-muted px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-card text-content-muted shadow-soft">
              <UserRound className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="text-[1.15rem] leading-7 font-medium text-content-strong">
                Account Summary
              </div>
              <p className="text-body text-content-muted">Email: {email}</p>
              <p className="text-body text-content-muted">Role: {role}</p>
            </div>
          </div>
        </div>

        {submitError ? (
          <div className="flex items-center gap-3 rounded-[0.95rem] border border-alert-error bg-alert-error px-4 py-3 text-left">
            <CircleAlert className="size-4 text-alert-error" />
            <p className="text-body-sm text-alert-error-body">{submitError}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          className="h-12 flex-1 rounded-[0.95rem] border-control bg-surface-card text-content-strong shadow-none hover:bg-surface-muted"
        >
          Back
        </Button>
        <PrimaryActionButton
          disabled={!canCreateAccount || isSubmitting}
          onClick={onCreateAccount}
          label={isSubmitting ? "Creating Account..." : "Create Account"}
        />
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options?: readonly string[];
}) {
  return (
    <div className="space-y-2.5">
      <Label
        htmlFor={id}
        className="text-[1.05rem] font-medium text-content-strong"
      >
        {label}
      </Label>
      {options ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger
            id={id}
            className="h-12 rounded-[0.95rem] px-3.5 text-base"
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent position="popper">
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-12 rounded-[0.95rem] text-base"
        />
      )}
    </div>
  );
}

function RoleCard({
  role,
  selected,
  onSelect,
  config,
}: {
  role: SignupRole;
  selected: boolean;
  onSelect: (role: SignupRole) => void;
  config: RoleConfig;
}) {
  const Icon = config.icon;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(role)}
      className={cn(
        "relative rounded-[1.25rem] border p-6 text-left transition-[border-color,box-shadow,transform,background-color] outline-none focus-visible:ring-4 focus-visible:ring-focus",
        selected
          ? "border-brand bg-linear-to-b from-white to-primary-tint/85 shadow-[0_24px_50px_-34px_rgb(37_99_235/0.6)] ring-4 ring-focus"
          : "border-surface bg-surface-card hover:border-brand-subtle hover:bg-surface-muted",
      )}
    >
      {selected ? (
        <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-medium text-brand-on shadow-soft">
          <CheckCircle2 className="size-3.5" />
          Selected
        </div>
      ) : null}

      <div
        className={cn(
          "mb-6 flex size-14 items-center justify-center rounded-[1rem] bg-surface-muted text-content-muted",
          selected && "bg-brand text-brand-on",
        )}
      >
        <Icon className="size-7" />
      </div>

      <div className="space-y-3">
        <div className="text-[1.8rem] leading-[1.15] font-semibold tracking-[-0.035em] text-content-strong">
          {config.title}
        </div>
        <p className="text-[1.05rem] leading-8 text-content-muted">
          {config.description}
        </p>
      </div>

      <div className="mt-5 space-y-2.5">
        {config.features.map((feature) => (
          <div
            key={feature}
            className={cn(
              "flex items-center gap-2.5 text-body-sm text-content-muted",
              selected && "text-content-strong",
            )}
          >
            <Check
              className={cn(
                "size-4 text-content-muted",
                selected && "text-brand",
              )}
            />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

function SignupStepper({ currentStep }: { currentStep: SignupStep }) {
  return (
    <div className="flex items-center gap-4">
      {[1, 2, 3].map((stepNumber) => (
        <div key={stepNumber} className="flex items-center gap-4">
          <StepCircle
            stepNumber={stepNumber as SignupStep}
            currentStep={currentStep}
          />
          {stepNumber < 3 ? (
            <div
              className={cn(
                "h-1 w-16 rounded-full",
                currentStep > stepNumber ? "bg-brand" : "bg-surface-muted",
              )}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function StepCircle({
  stepNumber,
  currentStep,
}: {
  stepNumber: SignupStep;
  currentStep: SignupStep;
}) {
  const isComplete = currentStep > stepNumber;
  const isCurrent = currentStep === stepNumber;

  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-full text-base font-medium",
        isComplete || isCurrent
          ? "bg-brand text-brand-on"
          : "bg-surface-muted text-content-muted",
      )}
    >
      {isComplete ? <Check className="size-5" /> : stepNumber}
    </div>
  );
}

function PrimaryActionButton({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      size="lg"
      disabled={disabled}
      onClick={onClick}
      className="h-12 flex-1 rounded-[0.95rem] border-transparent bg-linear-to-r from-[#3568EA] to-[#2D63E8] text-base font-medium text-white shadow-none hover:from-[#2E5ED8] hover:to-[#2757D6] disabled:opacity-100 disabled:from-[#9CB7F4] disabled:to-[#89A9F0] disabled:text-white"
    >
      {label}
    </Button>
  );
}

function LogoMark() {
  return (
    <div className="flex size-[3.15rem] items-center justify-center rounded-[1rem] bg-brand text-brand-on shadow-glow">
      <CalendarDays className="size-[1.4rem]" />
    </div>
  );
}
