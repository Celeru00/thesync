import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "max-w-sm",
  default: "max-w-lg",
  lg: "max-w-xl",
  xl: "max-w-3xl",
};

interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof sizeMap;
  showClose?: boolean;
}

export function BaseModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "default",
  showClose = true,
}: BaseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(sizeMap[size])}
        showClose={showClose}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {children && <DialogBody>{children}</DialogBody>}

        {footer !== undefined ? (
          <DialogFooter>{footer}</DialogFooter>
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onOpenChange(false)}>Confirm</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
