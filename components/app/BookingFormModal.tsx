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
  Booking,
  BookingStatus,
  BookingType,
  Course,
  Delegate,
} from "@/components/app/SystemProvider";
import { toDateInputValue } from "@/components/app/utils";

type BookingFormModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: (input: {
    delegateName: string;
    courseName: string;
    type: BookingType;
    date: string;
    status?: BookingStatus;
  }) => void;
  delegates: Delegate[];
  courses: Course[];
  initialValue?: Booking;
};

export default function BookingFormModal({
  open,
  title,
  onClose,
  onSubmit,
  delegates,
  courses,
  initialValue,
}: BookingFormModalProps) {
  const [delegateName, setDelegateName] = useState(
    initialValue?.delegateName ?? delegates[0]?.name ?? "",
  );
  const [courseName, setCourseName] = useState(
    initialValue?.courseName ?? courses[0]?.name ?? "",
  );
  const [type, setType] = useState<BookingType>(initialValue?.type ?? "Virtual");
  const [date, setDate] = useState(
    toDateInputValue(initialValue?.date ?? "2026-03-26"),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Capture delegate, course, delivery type, and date."
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              onSubmit({ delegateName, courseName, type, date });
              onClose();
            }}
          >
            Save booking
          </button>
        </div>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Delegate</span>
          <select
            value={delegateName}
            onChange={(event) => setDelegateName(event.target.value)}
            className={fieldClass}
          >
            {delegates.map((delegate) => (
              <option key={delegate.id} value={delegate.name}>
                {delegate.name}
              </option>
            ))}
          </select>
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
          <span className={labelClass}>Delivery type</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as BookingType)}
            className={fieldClass}
          >
            <option value="Virtual">Virtual</option>
            <option value="In-person">In-person</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className={labelClass}>Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={fieldClass}
          />
        </label>
      </div>
    </Modal>
  );
}
