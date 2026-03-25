import { AppIcon } from "@/components/dashboard/icons";

type FilterBarProps = {
  searchPlaceholder: string;
  filters: string[];
  searchValue: string;
  activeFilter: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  insightLabel?: string;
  insightMessage?: string;
};

export default function FilterBar({
  searchPlaceholder,
  filters,
  searchValue,
  activeFilter,
  onSearchChange,
  onFilterChange,
  insightLabel,
  insightMessage,
}: FilterBarProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.05)]">
      {insightMessage ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#dbe7ff] bg-[var(--primary-soft)] px-4 py-3 transition-all duration-200 ease-in-out hover:shadow-[var(--shadow-sm)]">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--primary)] shadow-sm">
            <AppIcon name="shield" className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
              {insightLabel ?? "Insight"}
            </p>
            <p className="mt-1 text-sm font-medium leading-6 text-slate-800">
              {insightMessage}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-sm">
          <AppIcon
            name="search"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3.5 text-sm text-slate-700 outline-none transition-all duration-150 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
          />
        </label>

        <div className="flex flex-wrap gap-2.5">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onFilterChange(filter)}
              className={`rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out ${
                activeFilter === filter
                  ? "border border-[#dbe7ff] bg-[var(--primary-soft)] text-[var(--primary)] shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
