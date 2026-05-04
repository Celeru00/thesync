import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ConfirmationVariant } from "@/types/modal";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  variant: ConfirmationVariant;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

const confirmButtonVariant: Record<
  ConfirmationVariant,
  "destructive" | "default" | "outline"
> = {
  destructive: "destructive",
  success: "default",
  warning: "default",
};

const confirmButtonClassName: Record<ConfirmationVariant, string> = {
  destructive: "",
  success: "bg-success hover:bg-success/90 text-white",
  warning: "bg-warning hover:bg-warning/90 text-white",
};

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  variant,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
}: ConfirmationModalProps) {
  const isDestructive = variant === "destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="max-w-md"
        // Destructive dialogs must not be dismissed by clicking outside
        onPointerDownOutside={
          isDestructive ? (e) => e.preventDefault() : undefined
        }
        onEscapeKeyDown={isDestructive ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader className="pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-content-muted">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmButtonVariant[variant]}
            className={confirmButtonClassName[variant]}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
