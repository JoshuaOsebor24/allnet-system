"use client";

import { useState } from "react";
import Modal from "@/components/app/Modal";
import {
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/app/ui";
import type {
  CertificateStatus,
  Course,
  Delegate,
  DelegateProgress,
} from "@/components/app/SystemProvider";
import { toDateInputValue } from "@/components/app/utils";

type DelegateFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<Delegate, "id" | "recordId">) => void;
  courses: Course[];
  initialValue?: Delegate;
};

export default function DelegateFormModal({
  open,
  onClose,
  onSubmit,
  courses,
  initialValue,
}: DelegateFormModalProps) {
  const [name, setName] = useState(initialValue?.name ?? "");
  const [email, setEmail] = useState(initialValue?.email ?? "");
  const [company, setCompany] = useState(initialValue?.company ?? "");
  const [courseName, setCourseName] = useState(
    initialValue?.courseName ?? courses[0]?.name ?? "",
  );
  const [progress, setProgress] = useState<DelegateProgress>(
    initialValue?.progress ?? "In training",
  );
  const [certificateStatus, setCertificateStatus] =
    useState<CertificateStatus>(initialValue?.certificateStatus ?? "Pending");
  const [expiry, setExpiry] = useState(
    toDateInputValue(initialValue?.expiry ?? "2026-04-08"),
  );
  const canSubmit = email.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialValue ? "Update delegate" : "Add delegate"}
      description="Create or update a delegate record."
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) {
                return;
              }

              onSubmit({
                name,
                email: email.trim(),
                company,
                courseName,
                progress,
                certificateStatus,
                expiry,
              });
              onClose();
            }}
          >
            Save delegate
          </button>
        </div>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Full name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClass}
            required
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Company</span>
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Course</span>
          <select
            value={courseName}
            onChange={(event) => setCourseName(event.target.value)}
            className={fieldClass}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.name}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Progress</span>
          <select
            value={progress}
            onChange={(event) => setProgress(event.target.value as DelegateProgress)}
            className={fieldClass}
          >
            <option value="In training">In training</option>
            <option value="Completed">Completed</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Certificate</span>
          <select
            value={certificateStatus}
            onChange={(event) =>
              setCertificateStatus(event.target.value as CertificateStatus)
            }
            className={fieldClass}
          >
            <option value="Pending">Pending</option>
            <option value="Issued">Issued</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Expiry</span>
          <input
            type="date"
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
            className={fieldClass}
          />
        </label>
      </div>
    </Modal>
  );
}
