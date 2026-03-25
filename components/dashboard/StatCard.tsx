import { interactivePanelClass } from "@/components/app/ui";
import { AppIcon, type IconName } from "@/components/dashboard/icons";

type StatCardProps = {
  icon: IconName;
  title: string;
  value: string;
  trend?: string;
  context?: string;
  positive?: boolean;
  statusLabel?: string;
  statusTone?: "healthy" | "warning" | "critical";
};

const statusToneStyles = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function StatCard({
  icon,
  title,
  value,
  trend,
  context,
  positive = true,
  statusLabel,
  statusTone = "healthy",
}: StatCardProps) {
  return (
    <div className={`${interactivePanelClass} p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <AppIcon name={icon} className="h-5 w-5" />
        </div>

        {trend ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.04em] ${
              positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <AppIcon
              name={positive ? "trending_up" : "trending_down"}
              className="h-3.5 w-3.5"
            />
            {trend}
          </span>
        ) : null}
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-[1.85rem] font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      {statusLabel ? (
        <span
          className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] ${statusToneStyles[statusTone]}`}
        >
          {statusLabel}
        </span>
      ) : null}
      {context ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{context}</p>
      ) : null}
    </div>
  );
}
