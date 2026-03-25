import { AppIcon, type IconName } from "@/components/dashboard/icons";

type Tone = "amber" | "blue" | "emerald";

const toneStyles: Record<Tone, string> = {
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-[var(--primary-soft)] text-[var(--primary)]",
  emerald: "bg-emerald-50 text-emerald-700",
};

type ActivityItemProps = {
  icon: IconName;
  tone: Tone;
  title: string;
  subtitle: string;
  time: string;
};

export default function ActivityItem({
  icon,
  tone,
  title,
  subtitle,
  time,
}: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 border-b border-slate-200/70 py-5 last:border-b-0 last:pb-0 first:pt-0">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}
      >
        <AppIcon name={icon} className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">{title}</p>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              {subtitle}
            </p>
          </div>
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
