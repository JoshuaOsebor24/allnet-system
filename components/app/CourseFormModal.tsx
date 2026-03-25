"use client";

import { useState } from "react";
import Modal from "@/components/app/Modal";
import {
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/app/ui";
import type { Course, CourseStatus } from "@/components/app/SystemProvider";
import { toDateInputValue } from "@/components/app/utils";

type CourseFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<Course, "id">) => void;
  initialValue?: Course;
};

export default function CourseFormModal({
  open,
  onClose,
  onSubmit,
  initialValue,
}: CourseFormModalProps) {
  const [code, setCode] = useState(initialValue?.code ?? "");
  const [name, setName] = useState(initialValue?.name ?? "");
  const [summary, setSummary] = useState(initialValue?.summary ?? "");
  const [category, setCategory] = useState(initialValue?.category ?? "Privacy");
  const [owner, setOwner] = useState(initialValue?.owner ?? "");
  const [nextSession, setNextSession] = useState(
    toDateInputValue(initialValue?.nextSession ?? "2026-03-26"),
  );
  const [seatsFilled, setSeatsFilled] = useState(
    String(initialValue?.seatsFilled ?? 0),
  );
  const [seatsTotal, setSeatsTotal] = useState(
    String(initialValue?.seatsTotal ?? 16),
  );
  const [status, setStatus] = useState<CourseStatus>(
    initialValue?.status ?? "Open",
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialValue ? "Edit course" : "Add course"}
      description="Create or update a training programme in the catalogue."
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              onSubmit({
                code,
                name,
                summary,
                category,
                owner,
                nextSession,
                seatsFilled: Number(seatsFilled),
                seatsTotal: Number(seatsTotal),
                status,
              });
              onClose();
            }}
          >
            Save course
          </button>
        </div>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Course code</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Course name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className={labelClass}>Summary</span>
          <input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={fieldClass}
          >
            <option value="Privacy">Privacy</option>
            <option value="Data Protection">Data Protection</option>
            <option value="Information Security">Information Security</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Owner</span>
          <input
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Next session</span>
          <input
            type="date"
            value={nextSession}
            onChange={(event) => setNextSession(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as CourseStatus)}
            className={fieldClass}
          >
            <option value="Open">Open</option>
            <option value="Full">Full</option>
            <option value="In progress">In progress</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Review due">Review due</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Seats filled</span>
          <input
            type="number"
            value={seatsFilled}
            onChange={(event) => setSeatsFilled(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Seats total</span>
          <input
            type="number"
            value={seatsTotal}
            onChange={(event) => setSeatsTotal(event.target.value)}
            className={fieldClass}
          />
        </label>
      </div>
    </Modal>
  );
}
