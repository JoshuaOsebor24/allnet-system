"use client";

import { useState } from "react";
import Modal from "@/components/app/Modal";
import {
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/app/ui";
import type { User, UserRole, UserStatus } from "@/components/app/SystemProvider";

type UserFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<User, "id" | "lastActive">) => void;
  initialValue?: User;
  lockRole?: boolean;
};

export default function UserFormModal({
  open,
  onClose,
  onSubmit,
  initialValue,
  lockRole = false,
}: UserFormModalProps) {
  const [name, setName] = useState(initialValue?.name ?? "");
  const [email, setEmail] = useState(initialValue?.email ?? "");
  const [role, setRole] = useState<UserRole>(initialValue?.role ?? "Operations");
  const [organisation, setOrganisation] = useState(
    initialValue?.role === "Client"
      ? initialValue?.company ?? ""
      : initialValue?.team ?? "Operations",
  );
  const [status, setStatus] = useState<UserStatus>(
    initialValue?.status ?? "Pending MFA",
  );

  const organisationLabel = role === "Client" ? "Company" : "Internal team";
  const resolvedRole = lockRole ? initialValue?.role ?? role : role;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialValue ? "Update user" : "Invite user"}
      description="Add a new user or update access details."
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
                name,
                email,
                role: resolvedRole,
                team: resolvedRole === "Client" ? "Client access" : organisation,
                company: resolvedRole === "Client" ? organisation : undefined,
                status,
                passwordResetPending: initialValue?.passwordResetPending ?? false,
              });
              onClose();
            }}
          >
            Save user
          </button>
        </div>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Name</span>
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
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Role</span>
          {lockRole ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-700">
              {resolvedRole}
            </div>
          ) : (
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className={fieldClass}
            >
              <option value="Admin">Admin</option>
              <option value="Operations">Operations</option>
              <option value="Compliance">Compliance</option>
              <option value="Client">Client</option>
            </select>
          )}
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>{organisationLabel}</span>
          <input
            value={organisation}
            onChange={(event) => setOrganisation(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as UserStatus)}
            className={fieldClass}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending MFA">Pending MFA</option>
            <option value="Suspended">Suspended</option>
          </select>
        </label>
      </div>
    </Modal>
  );
}
