import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn<TData> = {
  key: string;
  header: ReactNode;
  cell: (row: TData) => ReactNode;
  className?: string;
};

type DataTableProps<TData> = {
  columns: Array<DataTableColumn<TData>>;
  data: TData[];
  getRowKey: (row: TData) => string;
  emptyMessage?: string;
  className?: string;
};

export function DataTable<TData>({
  columns,
  data,
  getRowKey,
  emptyMessage = "No records found.",
  className,
}: DataTableProps<TData>) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-surface", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
          <thead className="bg-surface-muted-soft text-content-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn("px-4 py-3 font-medium", column.className)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface-card">
            {data.length > 0 ? (
              data.map((row) => (
                <tr key={getRowKey(row)} className="align-top">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-4 py-3", column.className)}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-content-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
