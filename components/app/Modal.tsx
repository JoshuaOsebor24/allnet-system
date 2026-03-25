"use client";

import { useEffect, type ReactNode } from "react";
import { iconButtonClass, panelClass } from "@/components/app/ui";
import { AppIcon } from "@/components/dashboard/icons";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={onClose}
      />
      <div className={`relative z-10 w-full max-w-2xl ${panelClass} shadow-[0_24px_48px_rgba(15,23,42,0.18)]`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className={iconButtonClass}
          >
            <AppIcon name="more_horiz" className="h-5 w-5 rotate-90" />
          </button>
        </div>

        <div className="px-6 py-6">{children}</div>
        {footer ? (
          <div className="border-t border-slate-200/80 px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
