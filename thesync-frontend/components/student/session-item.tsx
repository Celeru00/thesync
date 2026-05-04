import { CalendarDays, Clock, FileText, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UpcomingSession } from "@/types/dashboard";

interface SessionItemProps {
  session: UpcomingSession;
}

export function SessionItem({ session }: SessionItemProps) {
  const { title, adviserName, date, startTime, endTime, status, type } =
    session;

  const isDefense = type === "defense";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-surface p-4">
      {/* Type icon */}
      <div
        className={cn(
          "mt-0.5 shrink-0 rounded-xl p-2.5",
          isDefense ? "bg-violet-soft" : "bg-info-soft",
        )}
      >
        {isDefense ? (
          <Users className={cn("size-5 text-violet")} />
        ) : (
          <FileText className={cn("size-5 text-info")} />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Title row with badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-label leading-snug">{title}</p>
          <Badge
            variant={status === "approved" ? "success" : "warning"}
            className="shrink-0 capitalize"
          >
            {status}
          </Badge>
        </div>

        {/* Adviser */}
        <p className="text-body-sm">{adviserName}</p>

        {/* Date + time metadata */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
          <span className="text-body-sm flex items-center gap-1">
            <CalendarDays className="size-3.5 shrink-0" />
            {date}
          </span>
          <span className="text-body-sm flex items-center gap-1">
            <Clock className="size-3.5 shrink-0" />
            {startTime} – {endTime}
          </span>
        </div>
      </div>
    </div>
  );
}
