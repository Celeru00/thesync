import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ListWrapperProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ListWrapper({
  title,
  description,
  actions,
  filters,
  children,
  footer,
  className,
  contentClassName,
}: ListWrapperProps) {
  return (
    <Card className={cn("rounded-xl py-6 shadow-elevated", className)}>
      <CardHeader className="gap-4 px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? (
              <p className="mt-1 text-body-sm text-content-muted">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        {filters ? <div>{filters}</div> : null}
      </CardHeader>

      <CardContent className={cn("space-y-4 px-6", contentClassName)}>
        {children}
      </CardContent>

      {footer ? <div className="px-6 pt-2">{footer}</div> : null}
    </Card>
  );
}
