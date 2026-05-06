import { CalendarDays } from "lucide-react";

import type { AppRole } from "@/lib/auth/profile";
import { GoogleCalendarConnectButton } from "@/components/calendar/google-calendar-connect-button";

const copyByRole: Record<AppRole, string> = {
  admin:
    "Connect Google Calendar before viewing or syncing personal calendar events.",
  adviser:
    "Connect Google Calendar before viewing your calendar and syncing adviser schedule updates.",
  student:
    "Connect Google Calendar before viewing your calendar and syncing your personal schedule.",
};

type CalendarConnectionGateProps = {
  role: AppRole;
  nextPath: string;
  statusMessage?: string | null;
};

export function CalendarConnectionGate({
  role,
  nextPath,
  statusMessage,
}: CalendarConnectionGateProps) {
  return (
    <section className="flex w-full flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-[2.35rem] leading-[1.08] font-semibold tracking-[-0.05em] text-content-strong">
          Calendar
        </h1>
        <p className="max-w-3xl text-[1.05rem] leading-8 text-content-muted">
          Connect your Google Calendar before viewing calendar data in
          ThesisSync.
        </p>
      </header>

      <div className="rounded-[1.5rem] border border-brand-subtle bg-surface-card px-6 py-8 shadow-card">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary-tint text-brand">
            <CalendarDays className="size-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-content-strong">
              Connect Google Calendar
            </h2>
            <p className="text-body text-content-muted">{copyByRole[role]}</p>
          </div>

          {statusMessage ? (
            <p className="rounded-lg border border-brand-subtle bg-primary-tint/40 px-4 py-3 text-body-sm text-content-strong">
              {statusMessage}
            </p>
          ) : null}

          <GoogleCalendarConnectButton
            nextPath={nextPath}
            label="Connect and continue"
            className="rounded-lg"
          />
        </div>
      </div>
    </section>
  );
}
