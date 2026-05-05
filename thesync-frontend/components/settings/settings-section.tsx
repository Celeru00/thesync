import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SettingsSectionProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  titleClassName?: string;
};

export function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  titleClassName,
}: SettingsSectionProps) {
  return (
    <Card className="rounded-xl py-6 shadow-elevated">
      <CardHeader className="gap-2 px-6">
        {Icon ? (
          <div className="flex items-start gap-3">
            <Icon className="mt-1 size-5 shrink-0 text-content-strong" />
            <div>
              <CardTitle className={titleClassName}>{title}</CardTitle>
              {description ? (
                <CardDescription className="text-base">
                  {description}
                </CardDescription>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <CardTitle className={titleClassName}>{title}</CardTitle>
            {description ? (
              <CardDescription className="text-base">
                {description}
              </CardDescription>
            ) : null}
          </>
        )}
      </CardHeader>
      <CardContent className="px-6">{children}</CardContent>
    </Card>
  );
}
