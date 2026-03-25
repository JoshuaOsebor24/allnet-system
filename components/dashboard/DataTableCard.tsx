import type { ReactNode } from "react";
import EmptyState from "@/components/app/EmptyState";
import {
  panelClass,
  tableRowClass,
} from "@/components/app/ui";

export type DataTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type DataTableRow = {
  id: string;
  cells: Record<string, ReactNode>;
  onClick?: () => void;
  rowClassName?: string;
};

type DataTableCardProps = {
  title: string;
  description: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  actions?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
};

export default function DataTableCard({
  title,
  description,
  columns,
  rows,
  actions,
  emptyTitle = "No records found",
  emptyDescription = "No matching records were found for the current filters.",
  emptyAction,
}: DataTableCardProps) {
  return (
    <section className={`${panelClass} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-slate-200/80 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/80">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    secondaryAction={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={row.onClick}
                  data-interactive={row.onClick ? "true" : undefined}
                  className={`${tableRowClass} ${
                    row.onClick ? "cursor-pointer" : ""
                  } ${row.rowClassName ?? ""}`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-5 align-middle text-sm text-slate-700 ${
                        column.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {row.cells[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
