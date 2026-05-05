import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  /** Tint the icon container — defaults to "default" (brand soft) */
  variant?: "default" | "info" | "warning" | "success";
  className?: string;
}

const ICON_STYLE: Record<
  NonNullable<EmptyStateProps["variant"]>,
  { bg: string; color: string }
> = {
  default: { bg: "bg-surface", color: "text-content-muted" },
  info: { bg: "bg-info-soft", color: "text-info" },
  warning: { bg: "bg-warning-soft", color: "text-warning" },
  success: { bg: "bg-success/10", color: "text-success" },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const { bg, color } = ICON_STYLE[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex size-16 items-center justify-center rounded-2xl",
            bg,
          )}
        >
          <Icon className={cn("size-8", color)} />
        </div>
      )}

      <div className="space-y-1">
        <p className="text-label text-content-strong">{title}</p>
        {description && (
          <p className="max-w-xs text-body-sm text-content-muted">
            {description}
          </p>
        )}
      </div>

      {action && (
        <>
          {action.href ? (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </>
      )}
    </div>
  );
}
