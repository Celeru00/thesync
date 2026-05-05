import { Badge } from "@/components/ui/badge";
import type { InviteStatus } from "@/types/status";

const CONFIG: Record<
  InviteStatus,
  { variant: React.ComponentProps<typeof Badge>["variant"]; label: string }
> = {
  invited: { variant: "info", label: "Invited" },
  accepted: { variant: "success", label: "Accepted" },
  declined: { variant: "destructive", label: "Declined" },
  pending: { variant: "warning", label: "Pending" },
};

interface InviteBadgeProps {
  status: InviteStatus;
  className?: string;
}

export function InviteBadge({ status, className }: InviteBadgeProps) {
  const { variant, label } = CONFIG[status];
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
