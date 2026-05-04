import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-7 w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-focus focus-visible:ring-[3px] focus-visible:ring-focus has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 aria-invalid:border-error aria-invalid:ring-error [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-badge-primary bg-badge-primary text-badge-primary",
        secondary:
          "border-badge-secondary bg-badge-secondary text-badge-secondary",
        success: "border-badge-success bg-badge-success text-badge-success",
        warning: "border-badge-warning bg-badge-warning text-badge-warning",
        destructive: "border-badge-error bg-badge-error text-badge-error",
        info: "border-badge-info bg-badge-info text-badge-info",
        violet: "border-badge-special bg-badge-special text-badge-special",
        outline: "border-surface bg-surface-card text-content-strong",
        ghost: "border-transparent bg-transparent text-content-muted",
        link: "text-brand underline-offset-4 hover:text-brand-strong hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
