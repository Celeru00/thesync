import {
  CalendarDays,
  Clock,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  RefreshCw,
  UserRound,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ScheduleDetail } from "@/types/modal";

interface ScheduleDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ScheduleDetail;
  onJoinMeeting?: () => void;
  onRequestReschedule?: () => void;
}

export function ScheduleDetailsModal({
  open,
  onOpenChange,
  session,
  onJoinMeeting,
  onRequestReschedule,
}: ScheduleDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="pb-3">
          <DialogTitle>{session.title}</DialogTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="default">{session.type}</Badge>
            <Badge variant={session.status === "approved" ? "success" : "warning"} className="capitalize">
              {session.status}
            </Badge>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              icon={<CalendarDays className="size-4 text-info" />}
              label="Date"
              value={session.date}
            />
            <InfoCard
              icon={<Clock className="size-4 text-info" />}
              label="Time"
              value={`${session.startTime} – ${session.endTime}`}
            />
          </div>

          {/* Participants */}
          <div className="space-y-3">
            <SectionHeading icon={<UserRound className="size-4" />} label="Participants" />
            <div className="space-y-2">
              {session.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-surface px-4 py-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet">
                    <UserRound className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-label">{p.name}</p>
                    <p className="text-body-sm">{p.role}</p>
                  </div>
                  <div className="flex gap-2">
                    {p.email && (
                      <button
                        aria-label={`Email ${p.name}`}
                        className="rounded-md p-1.5 text-content-muted transition-colors hover:text-content-strong"
                      >
                        <Mail className="size-4" />
                      </button>
                    )}
                    <button
                      aria-label={`Message ${p.name}`}
                      className="rounded-md p-1.5 text-content-muted transition-colors hover:text-content-strong"
                    >
                      <MessageSquare className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <SectionHeading icon={<FileText className="size-4" />} label="Topic" />
            <p className="text-body-sm">{session.topic}</p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <p className="text-card-title text-content-strong">Description</p>
            <p className="text-body-sm">{session.description}</p>
          </div>

          {/* Location + Meet */}
          {(session.location ?? session.meetLink) && (
            <div className="grid grid-cols-2 gap-3">
              {session.location && (
                <div className="rounded-xl border border-surface p-4">
                  <div className="flex items-center gap-2 text-content-muted">
                    <MapPin className="size-4" />
                    <span className="text-body-sm">Location</span>
                  </div>
                  <p className="mt-1 text-label">{session.location}</p>
                </div>
              )}
              {session.meetLink && (
                <div className="rounded-xl border border-surface p-4">
                  <div className="flex items-center gap-2 text-content-muted">
                    <Video className="size-4" />
                    <span className="text-body-sm">Google Meet</span>
                  </div>
                  <a
                    href={session.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 text-label text-brand hover:underline"
                  >
                    Join Meeting
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex-wrap gap-2">
          {session.meetLink && (
            <Button
              className="bg-success hover:bg-success/90 text-white"
              onClick={onJoinMeeting}
            >
              <Video className="size-4" />
              Join Meeting
            </Button>
          )}
          <Button variant="outline" onClick={onRequestReschedule}>
            <RefreshCw className="size-4" />
            Request Reschedule
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-surface bg-info-soft/30 px-4 py-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-body-sm text-content-muted">{label}</p>
        <p className="text-label">{value}</p>
      </div>
    </div>
  );
}

function SectionHeading({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-content-strong">
      {icon}
      <span className="text-label font-semibold">{label}</span>
    </div>
  );
}
