import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-lg border border-control bg-surface-card px-3 py-2 text-[15px] transition-colors outline-none shadow-soft placeholder:text-placeholder focus-visible:border-focus focus-visible:ring-4 focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-field-disabled disabled:text-field-disabled disabled:opacity-100 aria-invalid:border-error aria-invalid:ring-4 aria-invalid:ring-error md:text-sm dark:bg-input/30 dark:aria-invalid:ring-error",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
