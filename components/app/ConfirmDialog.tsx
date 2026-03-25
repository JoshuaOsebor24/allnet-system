"use client";

import Modal from "@/components/app/Modal";
import {
  dangerButtonClass,
  secondaryButtonClass,
} from "@/components/app/ui";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={dangerButtonClass}>
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm leading-6 text-slate-600">{description}</p>
    </Modal>
  );
}
