import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/status";

const CONFIG: Record<
  UserRole,
  { variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  Student: { variant: "info" },
  Adviser: { variant: "violet" },
  Admin: { variant: "default" },
  Panelist: { variant: "secondary" },
};

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const { variant } = CONFIG[role];
  return (
    <Badge variant={variant} className={className}>
      {role}
    </Badge>
  );
}
