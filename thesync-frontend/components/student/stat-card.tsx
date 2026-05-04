import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName: string;
  iconBgClassName: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  iconBgClassName,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="px-5 pb-5 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="text-body-sm truncate">{label}</p>
            <p className="text-3xl font-bold text-content-strong">{value}</p>
          </div>
          <div className={cn("shrink-0 rounded-xl p-3", iconBgClassName)}>
            <Icon className={cn("size-5", iconClassName)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
