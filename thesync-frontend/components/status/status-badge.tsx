import { Badge } from "@/components/ui/badge";
import type { ConsultationStatus } from "@/types/consultation";

const CONFIG: Record<
  ConsultationStatus,
  { variant: React.ComponentProps<typeof Badge>["variant"]; label: string }
> = {
  approved: { variant: "success", label: "Approved" },
  pending: { variant: "warning", label: "Pending" },
  completed: { variant: "outline", label: "Completed" },
  rejected: { variant: "destructive", label: "Rejected" },
};

interface StatusBadgeProps {
  status: ConsultationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { variant, label } = CONFIG[status];
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
