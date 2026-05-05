import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationPlaceholderProps = {
  page?: number;
  totalPages?: number;
  totalItems?: number;
  className?: string;
};

export function PaginationPlaceholder({
  page = 1,
  totalPages = 1,
  totalItems,
  className,
}: PaginationPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-surface pt-4 text-body-sm text-content-muted sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p>
        {typeof totalItems === "number"
          ? `Showing ${totalItems} item${totalItems === 1 ? "" : "s"}`
          : "Pagination controls will appear here"}
      </p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled>
          Previous
        </Button>
        <span className="px-2 text-sm font-medium text-content-strong">
          Page {page} of {totalPages}
        </span>
        <Button type="button" variant="outline" size="sm" disabled>
          Next
        </Button>
      </div>
    </div>
  );
}
