"use client";

import {
  dangerButtonClass,
  ghostButtonClass,
  panelClass,
} from "@/components/app/ui";
import { AppIcon } from "@/components/dashboard/icons";

type ErrorStateProps = {
  title: string;
  description: string;
  onRetry?: () => void;
  onDismiss?: () => void;
};

export default function ErrorState({
  title,
  description,
  onRetry,
  onDismiss,
}: ErrorStateProps) {
  return (
    <div className={`${panelClass} border-rose-200/80 bg-rose-50/40 p-6`}>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-rose-100 text-rose-700">
          <AppIcon name="flag" className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-slate-950">
            {title}
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
          {(onRetry || onDismiss) ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {onRetry ? (
                <button type="button" onClick={onRetry} className={dangerButtonClass}>
                  Retry
                </button>
              ) : null}
              {onDismiss ? (
                <button type="button" onClick={onDismiss} className={ghostButtonClass}>
                  Dismiss
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
