import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  wrapperClassName?: string;
};

export function SearchInput({
  className,
  wrapperClassName,
  placeholder = "Search",
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-content-muted" />
      <Input
        type="search"
        placeholder={placeholder}
        className={cn("pl-9", className)}
        {...props}
      />
    </div>
  );
}
