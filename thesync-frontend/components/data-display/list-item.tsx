import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ListItemProps = {
  children: ReactNode;
  unread?: boolean;
  tone?: "default" | "info" | "danger";
  className?: string;
};

export function ListItem({
  children,
  unread = false,
  tone = "default",
  className,
}: ListItemProps) {
  return (
    <article
      className={cn(
        "rounded-lg border p-4",
        tone === "info" || unread
          ? "border-blue-200 bg-blue-50"
          : "border-surface bg-surface-card",
        tone === "danger" && "border-red-100 bg-red-50/60",
        className,
      )}
    >
      {children}
    </article>
  );
}
