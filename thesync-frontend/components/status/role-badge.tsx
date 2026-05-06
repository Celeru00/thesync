import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/status";

const CONFIG: Record<
  UserRole,
  { variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  student: { variant: "info" },
  adviser: { variant: "violet" },
  admin: { variant: "default" },
  panelist: { variant: "secondary" },
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
