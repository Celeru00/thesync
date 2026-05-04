import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-control bg-surface-card px-3 py-2 text-[15px] transition-colors outline-none shadow-soft file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-content-strong placeholder:text-placeholder focus-visible:border-focus focus-visible:ring-4 focus-visible:ring-focus disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-field-disabled disabled:text-field-disabled disabled:opacity-100 aria-invalid:border-error aria-invalid:ring-4 aria-invalid:ring-error md:text-sm dark:bg-input/30 dark:aria-invalid:ring-error",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
