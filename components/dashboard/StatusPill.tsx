import { badgeToneClass } from "@/components/app/ui";

type StatusTone = "neutral" | "positive" | "warning" | "danger";

type StatusPillProps = {
  label: string;
  tone?: StatusTone;
  tooltip?: string;
};

export default function StatusPill({
  label,
  tone = "neutral",
  tooltip,
}: StatusPillProps) {
  return (
    <span
      title={tooltip}
      data-tooltip={tooltip}
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] ${badgeToneClass[tone]} ${tooltip ? "app-tooltip" : ""}`}
    >
      {label}
    </span>
  );
}
