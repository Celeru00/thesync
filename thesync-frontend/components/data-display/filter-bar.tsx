import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FilterBarProps = {
  children: ReactNode;
  className?: string;
};

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-surface bg-surface-muted-soft p-3 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}
