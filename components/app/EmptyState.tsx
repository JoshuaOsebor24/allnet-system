"use client";

import type { ReactNode } from "react";
import { emptyStateClass, primaryButtonClass } from "@/components/app/ui";
import { AppIcon, type IconName } from "@/components/dashboard/icons";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: ReactNode;
};

export default function EmptyState({
  title,
  description,
  icon = "search",
  actionLabel,
  onAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className={emptyStateClass}>
      <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-[var(--primary)]">
        <AppIcon name={icon} className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
      {actionLabel && onAction ? (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onAction} className={primaryButtonClass}>
            {actionLabel}
          </button>
          {secondaryAction}
        </div>
      ) : secondaryAction ? (
        <div className="mt-5">{secondaryAction}</div>
      ) : null}
    </div>
  );
}
