import type { ReactNode } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DataTableCard, {
  type DataTableColumn,
  type DataTableRow,
} from "@/components/dashboard/DataTableCard";
import FilterBar from "@/components/dashboard/FilterBar";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusPill from "@/components/dashboard/StatusPill";
import type { IconName } from "@/components/dashboard/icons";

type SectionMetric = {
  icon: IconName;
  title: string;
  value: string;
  trend?: string;
  context?: string;
  positive?: boolean;
};

type SideItem = {
  title: string;
  helper: string;
  value: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
};

type SectionPageProps = {
  currentPath: string;
  title: string;
  description: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  insightLabel: string;
  insightMessage: string;
  searchPlaceholder: string;
  filters: string[];
  metrics: SectionMetric[];
  tableTitle: string;
  tableDescription: string;
  columns: DataTableColumn[];
  rows: DataTableRow[];
  tableActions?: ReactNode;
  sideTitle: string;
  sideDescription: string;
  sideItems: SideItem[];
};

export default function SectionPage({
  currentPath,
  title,
  description,
  primaryActionLabel,
  primaryActionHref,
  secondaryActionLabel,
  secondaryActionHref,
  insightLabel,
  insightMessage,
  searchPlaceholder,
  filters,
  metrics,
  tableTitle,
  tableDescription,
  columns,
  rows,
  tableActions,
  sideTitle,
  sideDescription,
  sideItems,
}: SectionPageProps) {
  const actions = [
    secondaryActionLabel && secondaryActionHref
      ? {
          href: secondaryActionHref,
          label: secondaryActionLabel,
          variant: "secondary" as const,
        }
      : null,
    {
      href: primaryActionHref,
      label: primaryActionLabel,
      variant: "primary" as const,
    },
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    variant?: "primary" | "secondary";
  }>;

  return (
    <DashboardShell currentPath={currentPath}>
      <PageHeader title={title} description={description} actions={actions} />

      <div className="mt-8">
        <FilterBar
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          searchValue=""
          activeFilter={filters[0] ?? ""}
          onSearchChange={() => {}}
          onFilterChange={() => {}}
          insightLabel={insightLabel}
          insightMessage={insightMessage}
        />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <StatCard
            key={metric.title}
            icon={metric.icon}
            title={metric.title}
            value={metric.value}
            trend={metric.trend}
            context={metric.context}
            positive={metric.positive}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr),340px]">
        <DataTableCard
          title={tableTitle}
          description={tableDescription}
          columns={columns}
          rows={rows}
          actions={tableActions}
        />

        <aside className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.05)]">
          <div className="border-b border-slate-200/80 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-950">
              {sideTitle}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              {sideDescription}
            </p>
          </div>

          <div className="divide-y divide-slate-200/80">
            {sideItems.map((item) => (
              <div key={`${item.title}-${item.value}`} className="px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-slate-950">
                    {item.title}
                  </h3>
                  <StatusPill label={item.value} tone={item.tone} />
                </div>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  {item.helper}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
