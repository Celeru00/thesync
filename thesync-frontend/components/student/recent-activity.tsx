import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/types/dashboard";

interface RecentActivityProps {
  items: ActivityItem[];
}

const dotColor: Record<ActivityItem["type"], string> = {
  approved: "bg-success",
  notification: "bg-info",
  completed: "bg-violet",
};

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  dotColor[item.type],
                )}
              />
              <div className="min-w-0 space-y-0.5">
                <p className="text-label">{item.title}</p>
                <p className="text-caption">{item.description}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-body-sm text-content-muted">
            No recent activity yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
