import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent text-sm font-medium whitespace-nowrap shadow-soft transition-[background-color,color,border-color,box-shadow,transform] outline-none select-none focus-visible:ring-4 focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-error aria-invalid:ring-4 aria-invalid:ring-error [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-button-primary text-button-primary hover:bg-button-primary-hover",
        outline:
          "border-surface bg-surface-card text-button-outline hover:border-brand-subtle hover:bg-button-outline-hover hover:text-button-outline-hover",
        secondary:
          "bg-button-secondary text-button-secondary hover:bg-button-secondary-hover aria-expanded:bg-button-secondary-hover aria-expanded:text-button-secondary",
        ghost:
          "bg-transparent text-button-ghost shadow-none hover:bg-button-ghost-hover hover:text-button-ghost-hover aria-expanded:bg-button-ghost-hover aria-expanded:text-button-ghost-hover",
        destructive:
          "bg-button-destructive text-button-destructive hover:bg-button-destructive-hover",
        link: "rounded-none px-0 text-button-link shadow-none hover:text-button-link-hover hover:underline",
      },
      size: {
        default:
          "h-10 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 px-3 text-xs has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-11 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
