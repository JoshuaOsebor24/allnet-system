"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/app/Modal";
import UserFormModal from "@/components/app/UserFormModal";
import {
  useSystem,
  type User,
  type UserRole,
  type UserStatus,
} from "@/components/app/SystemProvider";
import {
  dangerButtonClass,
  fieldClass,
  ghostButtonClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/app/ui";
import { matchesQuery, toCsv } from "@/components/app/utils";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DataTableCard, {
  type DataTableColumn,
  type DataTableRow,
} from "@/components/dashboard/DataTableCard";
import FilterBar from "@/components/dashboard/FilterBar";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusPill from "@/components/dashboard/StatusPill";
import { AppIcon } from "@/components/dashboard/icons";

type AccessRequest = {
  id: string;
  userId: string;
  type: "Role change" | "Access request";
  requestedRole?: UserRole;
  requestedStatus?: UserStatus;
  detail: string;
  requestedBy: string;
  priority: "High" | "Review";
};

type BulkAction = "deactivate" | "assign-role" | "send-mfa";

const userColumns: DataTableColumn[] = [
  { key: "select", label: "" },
  { key: "user", label: "User" },
  { key: "role", label: "Role" },
  { key: "organisation", label: "Company / Team" },
  { key: "lastActive", label: "Last active" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Access action", align: "right" },
];

const roleDetails: Record<
  UserRole,
  { summary: string; badgeClass: string; hint: string }
> = {
  Admin: {
    summary: "Full system access across users, security, reports, bookings, and delegates.",
    badgeClass:
      "inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-rose-700",
    hint: "Full system access",
  },
  Operations: {
    summary: "Bookings, delegates, course delivery, and operational scheduling controls.",
    badgeClass:
      "inline-flex items-center rounded-full border border-[#dbe7ff] bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-[var(--primary)]",
    hint: "Bookings and delegates",
  },
  Compliance: {
    summary: "Reports, audits, certification oversight, and compliance review workflows.",
    badgeClass:
      "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-amber-700",
    hint: "Reports and audits",
  },
  Client: {
    summary: "Client reporting access with limited visibility into assigned company records.",
    badgeClass:
      "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-emerald-700",
    hint: "Assigned client records",
  },
};

const initialAccessRequests: AccessRequest[] = [
  {
    id: "request-1",
    userId: "user-2",
    type: "Role change",
    requestedRole: "Compliance",
    detail: "Quarterly audit review cover requested for report approvals.",
    requestedBy: "Operations",
    priority: "High",
  },
  {
    id: "request-2",
    userId: "user-3",
    type: "Access request",
    requestedStatus: "Active",
    detail: "MFA reset verified. Restore compliance access for live audits.",
    requestedBy: "Identity desk",
    priority: "Review",
  },
  {
    id: "request-3",
    userId: "user-4",
    type: "Access request",
    requestedStatus: "Active",
    detail: "Client reporting access requested for Halden Energy compliance contact.",
    requestedBy: "Client services",
    priority: "High",
  },
];

function getStatusTone(status: UserStatus) {
  switch (status) {
    case "Active":
      return "positive" as const;
    case "Pending MFA":
      return "warning" as const;
    case "Suspended":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function getDefaultTeamForRole(role: UserRole) {
  switch (role) {
    case "Admin":
      return "Platform Security";
    case "Compliance":
      return "Compliance";
    case "Client":
      return "Client access";
    default:
      return "Operations";
  }
}

function getOrganisationDetails(user: User) {
  if (user.role === "Client") {
    return {
      value: user.company ?? "Assigned client",
      label: "Client company",
    };
  }

  return {
    value: user.team,
    label: "Internal team",
  };
}

function getPrimaryAction(user: User) {
  switch (user.status) {
    case "Active":
      return { label: "View profile", tone: "primary" as const };
    case "Pending MFA":
      return { label: "Resend MFA", tone: "secondary" as const };
    case "Inactive":
      return { label: "Activate", tone: "secondary" as const };
    case "Suspended":
      return { label: "Review access", tone: "secondary" as const };
  }
}

function getMenuActions(user: User) {
  if (user.status === "Active") {
    return [
      "Edit user",
      "Change role",
      "Reset password",
      "Deactivate",
    ] as const;
  }

  if (user.status === "Pending MFA") {
    return ["Reset password", "View profile"] as const;
  }

  if (user.status === "Inactive") {
    return ["Activate"] as const;
  }

  return ["View profile", "Reactivate"] as const;
}

export default function UsersPage() {
  const { state, addUser, updateUser, exportFile, showToast } = useSystem();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All users");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [teamFilter, setTeamFilter] = useState("All teams");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [roleUserId, setRoleUserId] = useState<string | null>(null);
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [bulkRoleOpen, setBulkRoleOpen] = useState(false);
  const [nextRole, setNextRole] = useState<UserRole>("Operations");
  const [roleOrganisation, setRoleOrganisation] = useState("Operations");
  const [bulkRole, setBulkRole] = useState<UserRole>("Operations");
  const [bulkOrganisation, setBulkOrganisation] = useState("Operations");
  const [accessRequests, setAccessRequests] = useState(initialAccessRequests);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const teams = Array.from(
    new Set(
      state.users.map((user) =>
        user.role === "Client" ? user.company ?? "Assigned client" : user.team,
      ),
    ),
  ).sort();

  const filteredUsers = useMemo(
    () =>
      state.users.filter((user) => {
        const organisation = getOrganisationDetails(user);
        const matchesSearch = matchesQuery(
          [
            user.name,
            user.email,
            user.role,
            user.team,
            user.company,
            user.status,
            organisation.value,
          ],
          search,
        );

        if (!matchesSearch) {
          return false;
        }

        if (roleFilter !== "All roles" && user.role !== roleFilter) {
          return false;
        }

        if (statusFilter !== "All statuses" && user.status !== statusFilter) {
          return false;
        }

        if (teamFilter !== "All teams" && organisation.value !== teamFilter) {
          return false;
        }

        switch (activeFilter) {
          case "Admin":
            return user.role === "Admin";
          case "Compliance":
            return user.role === "Compliance";
          case "Client":
            return user.role === "Client";
          case "Pending MFA":
            return user.status === "Pending MFA";
          case "Suspended":
            return user.status === "Suspended";
          default:
            return true;
        }
      }),
    [activeFilter, roleFilter, search, state.users, statusFilter, teamFilter],
  );

  const sortedAccessRequests = [...accessRequests].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority === "High" ? -1 : 1;
    }

    return left.type === "Role change" ? -1 : 1;
  });

  const viewUser = state.users.find((user) => user.id === viewUserId) ?? null;
  const editUser = state.users.find((user) => user.id === editUserId) ?? null;
  const roleUser = state.users.find((user) => user.id === roleUserId) ?? null;
  const resetUser = state.users.find((user) => user.id === resetUserId) ?? null;

  function openRoleModal(user: User) {
    setRoleUserId(user.id);
    setNextRole(user.role);
    setRoleOrganisation(
      user.role === "Client" ? user.company ?? "Assigned client" : user.team,
    );
  }

  function handleToggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function handleToggleSelectAll() {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(filteredUsers.map((user) => user.id));
  }

  function handleToggleActivation(user: User) {
    const nextStatus =
      user.status === "Inactive" || user.status === "Suspended"
        ? "Active"
        : "Inactive";

    updateUser(user.id, {
      status: nextStatus,
      lastActive:
        nextStatus === "Active"
          ? "Access restored just now"
          : "Access disabled just now",
      passwordResetPending:
        nextStatus === "Active" ? false : user.passwordResetPending,
    });
  }

  function handleResetPassword(user: User) {
    updateUser(user.id, {
      passwordResetPending: true,
      status: user.status === "Active" ? "Pending MFA" : user.status,
      lastActive: "Password reset pending",
    });
    setResetUserId(null);
  }

  function handleResendMfa(user: User) {
    updateUser(user.id, {
      passwordResetPending: true,
      lastActive: "MFA reminder sent just now",
    });
    showToast(`MFA reminder sent to ${user.name}`);
  }

  function handleApproveRequest(request: AccessRequest) {
    const user = state.users.find((candidate) => candidate.id === request.userId);
    if (!user) {
      return;
    }

    if (request.type === "Role change" && request.requestedRole) {
      const role = request.requestedRole;
      updateUser(user.id, {
        role,
        team: role === "Client" ? "Client access" : getDefaultTeamForRole(role),
        company: role === "Client" ? user.company ?? "Assigned client" : undefined,
        lastActive: "Role approved just now",
      });
    } else {
      updateUser(user.id, {
        status: request.requestedStatus ?? "Active",
        lastActive: "Access approved just now",
      });
    }

    setAccessRequests((current) => current.filter((item) => item.id !== request.id));
  }

  function handleRejectRequest(request: AccessRequest) {
    const user = state.users.find((candidate) => candidate.id === request.userId);
    if (!user) {
      return;
    }

    updateUser(user.id, {
      status: request.type === "Access request" ? "Suspended" : user.status,
      lastActive: "Request rejected just now",
    });
    setAccessRequests((current) => current.filter((item) => item.id !== request.id));
  }

  function handlePrimaryAction(user: User) {
    switch (user.status) {
      case "Active":
        setViewUserId(user.id);
        return;
      case "Pending MFA":
        handleResendMfa(user);
        return;
      case "Inactive":
        handleToggleActivation(user);
        return;
      case "Suspended":
        setViewUserId(user.id);
        return;
    }
  }

  function handleMenuAction(
    action: (typeof getMenuActions extends never ? never : string),
    user: User,
  ) {
    setMenuUserId(null);

    if (action === "Edit user") {
      setEditUserId(user.id);
      return;
    }

    if (action === "Change role") {
      openRoleModal(user);
      return;
    }

    if (action === "Reset password") {
      setResetUserId(user.id);
      return;
    }

    if (action === "Deactivate") {
      handleToggleActivation(user);
      return;
    }

    if (action === "Activate" || action === "Reactivate") {
      handleToggleActivation(user);
      return;
    }

    setViewUserId(user.id);
  }

  function handleBulkAction(action: BulkAction) {
    const selectedUsers = state.users.filter((user) => selectedIds.includes(user.id));

    if (selectedUsers.length === 0) {
      return;
    }

    if (action === "deactivate") {
      selectedUsers.forEach((user) => {
        if (user.status === "Active") {
          updateUser(user.id, {
            status: "Inactive",
            lastActive: "Access disabled just now",
          });
        }
      });
      setSelectedIds([]);
      showToast("Selected users deactivated");
      return;
    }

    if (action === "send-mfa") {
      selectedUsers.forEach((user) => {
        updateUser(user.id, {
          passwordResetPending: true,
          status: user.status === "Active" ? "Pending MFA" : user.status,
          lastActive: "MFA reminder sent just now",
        });
      });
      setSelectedIds([]);
      showToast("MFA reminders sent");
      return;
    }

    setBulkRoleOpen(true);
  }

  const rows: DataTableRow[] = filteredUsers.map((user) => {
    const organisation = getOrganisationDetails(user);
    const roleDetail = roleDetails[user.role];
    const primaryAction = getPrimaryAction(user);
    const menuActions = getMenuActions(user);

    return {
      id: user.id,
      rowClassName:
        user.status === "Suspended"
          ? "bg-rose-50/25"
          : user.status === "Pending MFA"
            ? "bg-amber-50/20"
            : "",
      cells: {
        select: (
          <input
            type="checkbox"
            checked={selectedIds.includes(user.id)}
            onChange={() => handleToggleSelection(user.id)}
            className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary-soft)]"
          />
        ),
        user: (
          <div>
            <button
              type="button"
              onClick={() => setViewUserId(user.id)}
              className="font-semibold text-slate-950 transition-colors duration-150 hover:text-[var(--primary)]"
            >
              {user.name}
            </button>
            <p className="mt-1 text-xs text-slate-500">{user.email}</p>
            {user.passwordResetPending ? (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Password reset pending
              </p>
            ) : null}
          </div>
        ),
        role: (
          <div className="inline-flex items-center gap-2">
            <span className={roleDetail.badgeClass}>{user.role}</span>
            <span
              title={roleDetail.summary}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"
            >
              <AppIcon name="help_outline" className="h-3.5 w-3.5" />
            </span>
          </div>
        ),
        organisation: (
          <div>
            <p className="font-medium text-slate-950">{organisation.value}</p>
            <p className="mt-1 text-xs text-slate-500">{organisation.label}</p>
          </div>
        ),
        lastActive: (
          <div>
            <p className="font-medium text-slate-950">{user.lastActive}</p>
            <p className="mt-1 text-xs text-slate-500">{roleDetail.hint}</p>
          </div>
        ),
        status: <StatusPill label={user.status} tone={getStatusTone(user.status)} />,
        actions: (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className={
                primaryAction.tone === "primary"
                  ? `${primaryButtonClass} px-3.5 py-2 text-xs`
                  : `${secondaryButtonClass} px-3.5 py-2 text-xs`
              }
              onClick={() => handlePrimaryAction(user)}
            >
              {primaryAction.label}
            </button>
            <div className="relative">
              <button
                type="button"
                className={`${ghostButtonClass} px-3 py-2 text-xs`}
                onClick={() =>
                  setMenuUserId((current) => (current === user.id ? null : user.id))
                }
              >
                More
              </button>
              {menuUserId === user.id ? (
                <div className="absolute right-0 z-20 mt-2 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_28px_rgba(15,23,42,0.14)]">
                  {menuActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-50"
                      onClick={() => handleMenuAction(action, user)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ),
      },
    };
  });

  const activeUsers = state.users.filter((user) => user.status === "Active").length;
  const pendingMfa = state.users.filter((user) => user.status === "Pending MFA").length;
  const suspendedUsers = state.users.filter((user) => user.status === "Suspended").length;
  const clientUsers = state.users.filter((user) => user.role === "Client").length;

  return (
    <DashboardShell currentPath="/users">
      <PageHeader
        title="Users"
        description="Manage roles, security state, approvals, and enterprise access workflows across internal and client accounts."
        actions={[
          {
            label: "Export users",
            variant: "secondary",
            onClick: () =>
              exportFile(
                "users.csv",
                toCsv([
                  ["Name", "Email", "Role", "Company / Team", "Status", "Last active"],
                  ...filteredUsers.map((user) => [
                    user.name,
                    user.email,
                    user.role,
                    user.role === "Client"
                      ? user.company ?? "Assigned client"
                      : user.team,
                    user.status,
                    user.lastActive,
                  ]),
                ]),
                "text/csv;charset=utf-8",
              ),
          },
          {
            label: "Invite user",
            onClick: () => setInviteOpen(true),
          },
        ]}
      />

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="person_outline"
          title="Active Users"
          value={String(activeUsers)}
          trend="+4 this week"
          context="Live system access"
          statusLabel="Healthy"
          statusTone="healthy"
        />
        <StatCard
          icon="notifications"
          title="Pending MFA"
          value={String(pendingMfa)}
          trend={`${accessRequests.length} queued`}
          context="Awaiting secure sign-in"
          statusLabel={pendingMfa > 0 ? "Warning" : "Healthy"}
          statusTone={pendingMfa > 0 ? "warning" : "healthy"}
          positive={pendingMfa === 0}
        />
        <StatCard
          icon="shield"
          title="Suspended Access"
          value={String(suspendedUsers)}
          trend={`${sortedAccessRequests.filter((item) => item.priority === "High").length} urgent`}
          context="Held for review"
          statusLabel={suspendedUsers > 0 ? "Critical" : "Healthy"}
          statusTone={suspendedUsers > 0 ? "critical" : "healthy"}
          positive={suspendedUsers === 0}
        />
        <StatCard
          icon="groups"
          title="Client Users"
          value={String(clientUsers)}
          trend="+2 invited"
          context="External access"
          statusLabel="Healthy"
          statusTone="healthy"
        />
      </div>

      <section className={`${panelClass} mt-8 overflow-hidden border-slate-200/80`}>
        <div className="border-b border-slate-200/80 bg-slate-50/60 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--primary)] shadow-sm">
              <AppIcon name="shield" className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Access requests
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-950">
                Approval queue
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Review urgent role changes and access requests before release.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {sortedAccessRequests.length > 0 ? (
            sortedAccessRequests.map((request) => {
              const user = state.users.find((candidate) => candidate.id === request.userId);

              if (!user) {
                return null;
              }

              return (
                <div
                  key={request.id}
                  className={`rounded-2xl border p-4 ${
                    request.priority === "High"
                      ? "border-amber-200 bg-amber-50/25"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {user.name}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {request.type}
                      </p>
                    </div>
                    <StatusPill
                      label={request.priority === "High" ? "Urgent" : "Review"}
                      tone={request.priority === "High" ? "warning" : "neutral"}
                    />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-700">{request.detail}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Requested by {request.requestedBy}
                    {request.requestedRole ? ` · ${request.requestedRole}` : ""}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={primaryButtonClass}
                      onClick={() => handleApproveRequest(request)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={dangerButtonClass}
                      onClick={() => handleRejectRequest(request)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-600 lg:col-span-2">
              No access requests are waiting on approval.
            </div>
          )}
        </div>
      </section>

      <div className="mt-8">
        <FilterBar
          searchPlaceholder="Search users, roles, companies, or teams"
          filters={["All users", "Admin", "Compliance", "Client", "Pending MFA", "Suspended"]}
          searchValue={search}
          activeFilter={activeFilter}
          onSearchChange={setSearch}
          onFilterChange={setActiveFilter}
          insightLabel="Access control"
          insightMessage={`${selectedIds.length} users selected. ${accessRequests.length} approval decisions are waiting on review.`}
        />
      </div>

      <section className={`${panelClass} mt-6 px-6 py-5`}>
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="grid gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Role
          </span>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className={`${fieldClass} h-12 border-slate-200`}
          >
            <option value="All roles">All roles</option>
            <option value="Admin">Admin</option>
            <option value="Operations">Operations</option>
            <option value="Compliance">Compliance</option>
            <option value="Client">Client</option>
          </select>
          </label>
          <label className="grid gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`${fieldClass} h-12 border-slate-200`}
          >
            <option value="All statuses">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending MFA">Pending MFA</option>
            <option value="Suspended">Suspended</option>
          </select>
          </label>
          <label className="grid gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Team
          </span>
          <select
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            className={`${fieldClass} h-12 border-slate-200`}
          >
            <option value="All teams">All teams</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
          </label>
        </div>
      </section>

      {selectedIds.length > 0 ? (
        <section className={`${panelClass} mt-6 px-6 py-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {selectedIds.length} users selected
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Apply access actions in bulk.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => handleBulkAction("deactivate")}
              >
                Deactivate
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => handleBulkAction("send-mfa")}
              >
                Send MFA reminder
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => handleBulkAction("assign-role")}
              >
                Assign role
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        <DataTableCard
          title="User directory"
          description="Role-based access view for internal teams and client reporting contacts."
          columns={userColumns}
          rows={rows}
          actions={
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={
                    filteredUsers.length > 0 && selectedIds.length === filteredUsers.length
                  }
                  onChange={handleToggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary-soft)]"
                />
                Select all
              </label>
              <button
                type="button"
                className="text-sm font-medium text-[var(--primary)] transition-colors duration-200 ease-in-out hover:text-[var(--primary-strong)]"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("All users");
                  setRoleFilter("All roles");
                  setStatusFilter("All statuses");
                  setTeamFilter("All teams");
                  setSelectedIds([]);
                }}
              >
                Reset view
              </button>
            </div>
          }
        />
      </div>

      <UserFormModal
        key={inviteOpen ? "user-invite-open" : "user-invite-closed"}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={(input) => addUser(input)}
      />

      <UserFormModal
        key={editUser ? `user-edit-${editUser.id}` : "user-edit-empty"}
        open={editUser !== null}
        onClose={() => setEditUserId(null)}
        initialValue={editUser ?? undefined}
        lockRole
        onSubmit={(input) => {
          if (!editUser) {
            return;
          }

          updateUser(editUser.id, input);
        }}
      />

      <Modal
        open={roleUser !== null}
        onClose={() => setRoleUserId(null)}
        title={roleUser ? `Change role for ${roleUser.name}` : "Change role"}
        description="Update role-based access for this account."
        footer={
          roleUser ? (
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setRoleUserId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => {
                  updateUser(roleUser.id, {
                    role: nextRole,
                    team:
                      nextRole === "Client"
                        ? "Client access"
                        : roleOrganisation || getDefaultTeamForRole(nextRole),
                    company:
                      nextRole === "Client"
                        ? roleOrganisation || "Assigned client"
                        : undefined,
                    lastActive: "Role changed just now",
                  });
                  setRoleUserId(null);
                }}
              >
                Save role
              </button>
            </div>
          ) : null
        }
      >
        {roleUser ? (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Role
              </span>
              <select
                value={nextRole}
                onChange={(event) => {
                  const role = event.target.value as UserRole;
                  setNextRole(role);
                  setRoleOrganisation(
                    role === "Client"
                      ? roleUser.company ?? "Assigned client"
                      : roleUser.team || getDefaultTeamForRole(role),
                  );
                }}
                className={fieldClass}
              >
                <option value="Admin">Admin</option>
                <option value="Operations">Operations</option>
                <option value="Compliance">Compliance</option>
                <option value="Client">Client</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {nextRole === "Client" ? "Company" : "Internal team"}
              </span>
              <input
                value={roleOrganisation}
                onChange={(event) => setRoleOrganisation(event.target.value)}
                className={fieldClass}
              />
            </label>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={bulkRoleOpen}
        onClose={() => setBulkRoleOpen(false)}
        title="Assign role in bulk"
        description="Apply one role to the selected users."
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setBulkRoleOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => {
                state.users
                  .filter((user) => selectedIds.includes(user.id))
                  .forEach((user) => {
                    updateUser(user.id, {
                      role: bulkRole,
                      team: bulkRole === "Client" ? "Client access" : bulkOrganisation,
                      company:
                        bulkRole === "Client" ? bulkOrganisation : undefined,
                      lastActive: "Role changed in bulk just now",
                    });
                  });
                setBulkRoleOpen(false);
                setSelectedIds([]);
                showToast("Role assigned in bulk");
              }}
            >
              Assign role
            </button>
          </div>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Role
            </span>
            <select
              value={bulkRole}
              onChange={(event) => {
                const role = event.target.value as UserRole;
                setBulkRole(role);
                setBulkOrganisation(getDefaultTeamForRole(role));
              }}
              className={fieldClass}
            >
              <option value="Admin">Admin</option>
              <option value="Operations">Operations</option>
              <option value="Compliance">Compliance</option>
              <option value="Client">Client</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {bulkRole === "Client" ? "Company" : "Internal team"}
            </span>
            <input
              value={bulkOrganisation}
              onChange={(event) => setBulkOrganisation(event.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={resetUser !== null}
        onClose={() => setResetUserId(null)}
        title={resetUser ? `Reset password for ${resetUser.name}` : "Reset password"}
        description="Confirm this critical action before sending a password reset."
        footer={
          resetUser ? (
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setResetUserId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={dangerButtonClass}
                onClick={() => handleResetPassword(resetUser)}
              >
                Confirm reset
              </button>
            </div>
          ) : null
        }
      >
        <p className="text-sm leading-6 text-slate-600">
          This will trigger a password reset flow and may move the account into `Pending MFA`.
        </p>
      </Modal>

      <Modal
        open={viewUser !== null}
        onClose={() => setViewUserId(null)}
        title={viewUser?.name ?? "User profile"}
        description="Access profile, organisation context, and security state."
        footer={
          viewUser ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setViewUserId(null)}
              >
                Close
              </button>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => {
                    setEditUserId(viewUser.id);
                    setViewUserId(null);
                  }}
                >
                  Edit user
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => {
                    openRoleModal(viewUser);
                    setViewUserId(null);
                  }}
                >
                  Change role
                </button>
                <button
                  type="button"
                  className={primaryButtonClass}
                  onClick={() => setResetUserId(viewUser.id)}
                >
                  Reset password
                </button>
              </div>
            </div>
          ) : null
        }
      >
        {viewUser ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className={`${panelClass} p-5`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                User
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {viewUser.name}
              </p>
              <p className="mt-1 text-sm text-slate-600">{viewUser.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill label={viewUser.status} tone={getStatusTone(viewUser.status)} />
                {viewUser.passwordResetPending ? (
                  <StatusPill label="Reset pending" tone="warning" />
                ) : null}
              </div>
            </div>

            <div className={`${panelClass} p-5`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Role
              </p>
              <div className="mt-2 inline-flex items-center gap-2">
                <span className={roleDetails[viewUser.role].badgeClass}>
                  {viewUser.role}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {roleDetails[viewUser.role].summary}
              </p>
            </div>

            <div className={`${panelClass} p-5`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Company / Team
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {getOrganisationDetails(viewUser).value}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {getOrganisationDetails(viewUser).label}
              </p>
            </div>

            <div className={`${panelClass} p-5`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Security
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {viewUser.lastActive}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {viewUser.status === "Pending MFA"
                  ? "Secure sign-in completion is still required."
                  : viewUser.status === "Suspended"
                    ? "Access is currently held pending approval or review."
                    : "Account is operating within the current access policy."}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardShell>
  );
}
