import { cn } from "@/lib/utils";

/** Small dot shown on an individual notification row to indicate unread state */
export function NotificationUnreadDot({ className }: { className?: string }) {
  return (
    <span
      aria-label="Unread"
      className={cn("inline-block size-2 rounded-full bg-brand", className)}
    />
  );
}

/** Count badge shown on the bell icon — hidden when count is 0 */
export function NotificationCountBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <span
      aria-label={`${count} unread notification${count !== 1 ? "s" : ""}`}
      className={cn(
        "flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-semibold leading-none text-white",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
