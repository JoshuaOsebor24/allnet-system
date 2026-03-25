export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(11,60,145,0.12),0_8px_18px_rgba(11,60,145,0.16)] transition-all duration-150 hover:bg-[var(--primary-strong)] hover:shadow-[var(--shadow-md)] active:translate-y-px active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[var(--shadow-sm)] transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 hover:shadow-[var(--shadow-md)] active:translate-y-px active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

export const ghostButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-transparent px-3.5 py-2 text-sm font-medium text-[var(--primary)] transition-all duration-150 hover:bg-slate-50 hover:text-[var(--primary-strong)] active:translate-y-px active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-700 transition-all duration-150 hover:bg-rose-50 hover:shadow-[var(--shadow-md)] active:translate-y-px active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

export const fieldClass =
  "w-full rounded-[var(--radius-sm)] border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none shadow-[var(--shadow-sm)] transition-all duration-150 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500";

export const panelClass =
  "rounded-[var(--radius-md)] border border-slate-200/80 bg-white shadow-[var(--shadow-sm),var(--shadow-md)]";

export const interactivePanelClass =
  `${panelClass} transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]`;

export const iconButtonClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-slate-300 bg-white text-slate-600 shadow-[var(--shadow-sm)] transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 active:scale-[0.99]";

export const tableRowClass =
  "transition-all duration-150 hover:bg-slate-50/90";

export const emptyStateClass =
  "flex min-h-[220px] flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center";

export const skeletonBlockClass =
  "skeleton-shimmer rounded-[var(--radius-sm)]";

export const badgeToneClass = {
  neutral: "border border-slate-200 bg-slate-50 text-slate-700",
  positive: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border border-amber-200 bg-amber-50 text-amber-700",
  danger: "border border-rose-200 bg-rose-50 text-rose-700",
} as const;
