"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/app/Modal";
import DelegateFormModal from "@/components/app/DelegateFormModal";
import { useSystem, type Delegate } from "@/components/app/SystemProvider";
import {
  fieldClass,
  ghostButtonClass,
  labelClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/app/ui";
import {
  formatDisplayDate,
  isWithinDays,
  matchesQuery,
  toCsv,
} from "@/components/app/utils";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DataTableCard, {
  type DataTableColumn,
  type DataTableRow,
} from "@/components/dashboard/DataTableCard";
import FilterBar from "@/components/dashboard/FilterBar";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusPill from "@/components/dashboard/StatusPill";
import { AppIcon, type IconName } from "@/components/dashboard/icons";

type RiskStatus = "Urgent" | "Expiring soon" | "Safe";
type QueueTone = "danger" | "warning" | "neutral";
type PrimaryAction = "Issue certificate" | "Mark complete" | "Follow up";

const delegateColumns: DataTableColumn[] = [
  { key: "select", label: "" },
  { key: "delegate", label: "Delegate" },
  { key: "company", label: "Company" },
  { key: "course", label: "Course" },
  { key: "stage", label: "Stage" },
  { key: "certificate", label: "Certificate" },
  { key: "risk", label: "Risk" },
  { key: "workflow", label: "Next action" },
  { key: "actions", label: "Actions", align: "right" },
];

const numberFormatter = new Intl.NumberFormat("en-GB");

const queueToneStyles: Record<
  QueueTone,
  { container: string; icon: string }
> = {
  danger: {
    container: "border-rose-200 bg-rose-50/35",
    icon: "bg-rose-100 text-rose-700",
  },
  warning: {
    container: "border-amber-200 bg-amber-50/35",
    icon: "bg-amber-100 text-amber-700",
  },
  neutral: {
    container: "border-slate-200 bg-slate-50/65",
    icon: "bg-[var(--primary-soft)] text-[var(--primary)]",
  },
};

function getRiskStatus(delegate: Delegate): RiskStatus {
  if (isWithinDays(delegate.expiry, 7)) {
    return "Urgent";
  }

  if (isWithinDays(delegate.expiry, 14)) {
    return "Expiring soon";
  }

  return "Safe";
}

function getRiskTone(risk: RiskStatus) {
  switch (risk) {
    case "Urgent":
      return "danger" as const;
    case "Expiring soon":
      return "warning" as const;
    default:
      return "positive" as const;
  }
}

function getQueueState(delegate: Delegate): {
  tone: QueueTone;
  icon: IconName;
  helper: string;
  priority: number;
} {
  const risk = getRiskStatus(delegate);

  if (risk === "Urgent") {
    return {
      tone: "danger",
      icon: "flag",
      helper: "Expiry or certification action is due immediately.",
      priority: 0,
    };
  }

  if (risk === "Expiring soon") {
    return {
      tone: "warning",
      icon: "clock",
      helper: "Renewal outreach is required before the window closes.",
      priority: 1,
    };
  }

  if (
    delegate.progress === "Completed" &&
    delegate.certificateStatus === "Pending"
  ) {
    return {
      tone: "warning",
      icon: "badge",
      helper: "Training is complete and certificate release is waiting.",
      priority: 2,
    };
  }

  if (delegate.progress === "In training") {
    return {
      tone: "neutral",
      icon: "school",
      helper: "Delegate is still progressing through delivery.",
      priority: 3,
    };
  }

  return {
    tone: "neutral",
    icon: "check_circle",
    helper: "No immediate action required.",
    priority: 4,
  };
}

function getDaysUntilExpiry(value: string) {
  const target = new Date(`${value}T00:00:00Z`);
  const baseline = new Date("2026-03-25T00:00:00Z");
  const diff = Math.ceil((target.getTime() - baseline.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getCountdownLabel(delegate: Delegate) {
  const days = getDaysUntilExpiry(delegate.expiry);

  if (days <= 0) {
    return "Due today";
  }

  if (days === 1) {
    return "Due in 1 day";
  }

  return `Due in ${days} days`;
}

function getPrimaryAction(delegate: Delegate): PrimaryAction {
  if (
    delegate.progress === "Completed" &&
    delegate.certificateStatus === "Pending"
  ) {
    return "Issue certificate";
  }

  if (delegate.progress === "In training") {
    return "Mark complete";
  }

  return "Follow up";
}

function sortDelegates(left: Delegate, right: Delegate) {
  const leftQueue = getQueueState(left);
  const rightQueue = getQueueState(right);

  if (leftQueue.priority !== rightQueue.priority) {
    return leftQueue.priority - rightQueue.priority;
  }

  if (left.certificateStatus !== right.certificateStatus) {
    return left.certificateStatus === "Pending" ? -1 : 1;
  }

  return left.expiry.localeCompare(right.expiry);
}

export default function DelegatesPage() {
  const { state, addDelegate, updateDelegate, exportFile, showToast } =
    useSystem();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All delegates");
  const [selectedCompany, setSelectedCompany] = useState<string>("All companies");
  const [selectedCourse, setSelectedCourse] = useState<string>("All courses");
  const [selectedStatus, setSelectedStatus] = useState<string>("All statuses");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDelegateId, setSelectedDelegateId] = useState<string | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isAdmin = state.users.some(
    (user) =>
      user.name === "Alex Chen" &&
      user.role === "Admin" &&
      user.status === "Active",
  );

  const selectedDelegate =
    state.delegates.find((delegate) => delegate.id === selectedDelegateId) ??
    null;

  const companies = Array.from(new Set(state.delegates.map((delegate) => delegate.company))).sort();
  const courses = Array.from(new Set(state.delegates.map((delegate) => delegate.courseName))).sort();

  const filteredDelegates = useMemo(
    () =>
      [...state.delegates]
        .filter((delegate) => {
          const risk = getRiskStatus(delegate);
          const queueState = getQueueState(delegate);
          const matchesSearch = matchesQuery(
            [
              delegate.name,
              delegate.recordId,
              delegate.company,
              delegate.courseName,
              delegate.progress,
              delegate.certificateStatus,
              risk,
              queueState.helper,
            ],
            search,
          );

          if (!matchesSearch) {
            return false;
          }

          if (selectedCompany !== "All companies" && delegate.company !== selectedCompany) {
            return false;
          }

          if (selectedCourse !== "All courses" && delegate.courseName !== selectedCourse) {
            return false;
          }

          if (selectedStatus !== "All statuses") {
            if (selectedStatus === "Training" && delegate.progress !== "In training") {
              return false;
            }

            if (selectedStatus === "Completed" && delegate.progress !== "Completed") {
              return false;
            }

            if (
              selectedStatus === "Certificate pending" &&
              delegate.certificateStatus !== "Pending"
            ) {
              return false;
            }

            if (
              selectedStatus === "Certificate issued" &&
              delegate.certificateStatus !== "Issued"
            ) {
              return false;
            }
          }

          switch (activeFilter) {
            case "Urgent":
              return risk === "Urgent";
            case "Expiring soon":
              return risk === "Expiring soon";
            case "Pending":
              return (
                delegate.progress === "Completed" &&
                delegate.certificateStatus === "Pending"
              );
            case "Completed":
              return (
                delegate.progress === "Completed" &&
                delegate.certificateStatus === "Issued"
              );
            default:
              return true;
          }
        })
        .sort(sortDelegates),
    [activeFilter, search, selectedCompany, selectedCourse, selectedStatus, state.delegates],
  );

  const certificationQueue = filteredDelegates
    .filter(
      (delegate) =>
        getRiskStatus(delegate) !== "Safe" ||
        delegate.certificateStatus === "Pending",
    )
    .sort(sortDelegates)
    .slice(0, 5);

  const activeDelegates = state.summary.activeDelegateCount;
  const completedDelegates = Math.round(activeDelegates * 0.786);
  const urgentCount = state.delegates.filter(
    (delegate) => getRiskStatus(delegate) === "Urgent",
  ).length;
  const expiringSoonCount = state.delegates.filter(
    (delegate) => getRiskStatus(delegate) === "Expiring soon",
  ).length;
  const pendingCertificates = state.delegates.filter(
    (delegate) =>
      delegate.progress === "Completed" &&
      delegate.certificateStatus === "Pending",
  ).length;
  const completedRate = ((completedDelegates / activeDelegates) * 100).toFixed(1);

  function handleToggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function handleToggleSelectAll() {
    if (selectedIds.length === filteredDelegates.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(filteredDelegates.map((delegate) => delegate.id));
  }

  function handleFollowUp(delegate: Delegate) {
    if (delegate.followUpSent) {
      return;
    }

    updateDelegate(delegate.id, { followUpSent: true });
    showToast(`Reminder sent for ${delegate.name}`);
  }

  function handleMarkComplete(delegate: Delegate) {
    if (!isAdmin || delegate.progress === "Completed") {
      return;
    }

    updateDelegate(delegate.id, { progress: "Completed" });
    showToast(`Training marked complete for ${delegate.name}`);
  }

  function handleIssueCertificate(delegate: Delegate) {
    if (
      delegate.progress !== "Completed" ||
      delegate.certificateStatus === "Issued"
    ) {
      return;
    }

    updateDelegate(delegate.id, { certificateStatus: "Issued" });
    showToast(`Certificate issued for ${delegate.name}`);
  }

  function handlePrimaryAction(delegate: Delegate) {
    const action = getPrimaryAction(delegate);

    if (action === "Issue certificate") {
      handleIssueCertificate(delegate);
      return;
    }

    if (action === "Mark complete") {
      handleMarkComplete(delegate);
      return;
    }

    handleFollowUp(delegate);
  }

  function handleBulkAction(action: "issue" | "remind" | "complete") {
    const selectedDelegates = state.delegates.filter((delegate) =>
      selectedIds.includes(delegate.id),
    );

    if (selectedDelegates.length === 0) {
      return;
    }

    selectedDelegates.forEach((delegate) => {
      if (action === "issue") {
        if (
          delegate.progress === "Completed" &&
          delegate.certificateStatus === "Pending"
        ) {
          updateDelegate(delegate.id, { certificateStatus: "Issued" });
        }
      }

      if (action === "remind" && !delegate.followUpSent) {
        updateDelegate(delegate.id, { followUpSent: true });
      }

      if (action === "complete" && isAdmin && delegate.progress !== "Completed") {
        updateDelegate(delegate.id, { progress: "Completed" });
      }
    });

    setSelectedIds([]);
    showToast(
      action === "issue"
        ? "Certificates issued"
        : action === "remind"
          ? "Reminders sent"
          : "Delegates marked complete",
    );
  }

  const rows: DataTableRow[] = filteredDelegates.map((delegate) => {
    const risk = getRiskStatus(delegate);
    const queueState = getQueueState(delegate);
    const primaryAction = getPrimaryAction(delegate);

    return {
      id: delegate.id,
      onClick: () => setSelectedDelegateId(delegate.id),
      rowClassName:
        queueState.tone === "danger"
          ? "bg-rose-50/30 hover:!bg-rose-50/55"
          : queueState.tone === "warning"
            ? "bg-amber-50/25 hover:!bg-amber-50/50"
            : "",
      cells: {
        select: (
          <input
            type="checkbox"
            checked={selectedIds.includes(delegate.id)}
            onChange={() => handleToggleSelection(delegate.id)}
            onClick={(event) => event.stopPropagation()}
            className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary-soft)]"
          />
        ),
        delegate: (
          <div>
            <p className="font-semibold text-slate-950">{delegate.name}</p>
            <p className="mt-1 text-xs text-slate-500">{delegate.recordId}</p>
          </div>
        ),
        company: (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedCompany(delegate.company);
            }}
            className="text-left font-medium text-[var(--primary)] transition-colors duration-150 hover:text-[var(--primary-strong)]"
          >
            {delegate.company}
          </button>
        ),
        course: (
          <div>
            <p className="font-medium text-slate-800">{delegate.courseName}</p>
            <p className="mt-1 text-xs text-slate-500">Training record</p>
          </div>
        ),
        stage: (
          <StatusPill
            label={delegate.progress === "In training" ? "Training" : "Completed"}
            tone={delegate.progress === "Completed" ? "positive" : "neutral"}
          />
        ),
        certificate:
          delegate.certificateStatus === "Issued" ? (
            <StatusPill label="Certified" tone="positive" />
          ) : (
            <StatusPill label="Pending" tone="warning" />
          ),
        risk: <StatusPill label={risk} tone={getRiskTone(risk)} />,
        workflow: (
          <div>
            <p className="font-semibold text-slate-950">{primaryAction}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-600">
              {queueState.helper}
            </p>
          </div>
        ),
        actions: (
          <div
            className="flex min-w-[168px] flex-col items-end gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            {primaryAction !== "Follow up" ? (
              <button
                type="button"
                className={`${primaryButtonClass} w-full justify-center`}
                onClick={() => handlePrimaryAction(delegate)}
                disabled={primaryAction === "Mark complete" && !isAdmin}
              >
                {primaryAction}
              </button>
            ) : null}
            {delegate.followUpSent ? (
              <span className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-600">
                Reminder sent
              </span>
            ) : (
              <button
                type="button"
                className={`${secondaryButtonClass} w-full justify-center`}
                onClick={() => handleFollowUp(delegate)}
              >
                Follow up
              </button>
            )}
            <button
              type="button"
              className="text-sm font-medium text-[var(--primary)] transition-colors duration-200 ease-in-out hover:text-[var(--primary-strong)]"
              onClick={() => setSelectedDelegateId(delegate.id)}
            >
              View details
            </button>
          </div>
        ),
      },
    };
  });

  return (
    <DashboardShell currentPath="/delegates">
      <PageHeader
        title="Delegates"
        description="Manage delegate workflow, certificate release, and renewal risk across active cohorts."
        actions={[
          {
            label: "Export delegates",
            variant: "secondary",
            onClick: () =>
              exportFile(
                "delegates.csv",
                toCsv([
                  [
                    "Delegate",
                    "Record ID",
                    "Company",
                    "Course",
                    "Stage",
                    "Certificate Status",
                    "Risk Status",
                    "Expiry",
                  ],
                  ...filteredDelegates.map((delegate) => [
                    delegate.name,
                    delegate.recordId,
                    delegate.company,
                    delegate.courseName,
                    delegate.progress === "In training" ? "Training" : "Completed",
                    delegate.certificateStatus,
                    getRiskStatus(delegate),
                    formatDisplayDate(delegate.expiry),
                  ]),
                ]),
                "text/csv;charset=utf-8",
              ),
          },
          {
            label: "Add delegate",
            onClick: () => setModalOpen(true),
          },
        ]}
      />

      <div className="mt-8">
        <FilterBar
          searchPlaceholder="Search delegates, companies, or courses"
          filters={[
            "All delegates",
            "Urgent",
            "Expiring soon",
            "Pending",
            "Completed",
          ]}
          searchValue={search}
          activeFilter={activeFilter}
          onSearchChange={setSearch}
          onFilterChange={setActiveFilter}
          insightLabel="Workflow focus"
          insightMessage={`${urgentCount} delegates are urgent, ${expiringSoonCount} are expiring soon, and ${pendingCertificates} certificates are still pending release.`}
        />
      </div>

      <section className={`${panelClass} mt-6 px-6 py-5`}>
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="grid gap-2">
          <span className={labelClass}>Filter by course</span>
          <select
            value={selectedCourse}
            onChange={(event) => setSelectedCourse(event.target.value)}
            className={`${fieldClass} h-12`}
          >
            <option value="All courses">All courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
          </label>

          <label className="grid gap-2">
          <span className={labelClass}>Filter by company</span>
          <select
            value={selectedCompany}
            onChange={(event) => setSelectedCompany(event.target.value)}
            className={`${fieldClass} h-12`}
          >
            <option value="All companies">All companies</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
          </label>

          <label className="grid gap-2">
          <span className={labelClass}>Filter by status</span>
          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className={`${fieldClass} h-12`}
          >
            <option value="All statuses">All statuses</option>
            <option value="Training">Training</option>
            <option value="Completed">Completed</option>
            <option value="Certificate pending">Certificate pending</option>
            <option value="Certificate issued">Certificate issued</option>
          </select>
          </label>
        </div>
      </section>

      {selectedIds.length > 0 ? (
        <section className={`${panelClass} mt-6 px-6 py-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {selectedIds.length} delegates selected
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Run workflow actions in bulk.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => handleBulkAction("issue")}
              >
                Issue certificates
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => handleBulkAction("remind")}
              >
                Send reminders
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => handleBulkAction("complete")}
              >
                Mark complete
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="groups"
          title="Active Delegates"
          value={numberFormatter.format(activeDelegates)}
          trend="+64 this month"
          context="Across all compliance cohorts"
          statusLabel="Healthy"
          statusTone="healthy"
        />
        <StatCard
          icon="check_circle"
          title="Completed Delegates"
          value={numberFormatter.format(completedDelegates)}
          trend={`${completedRate}% complete`}
          context="Training completed across live records"
          statusLabel="Healthy"
          statusTone="healthy"
        />
        <StatCard
          icon="badge"
          title="Pending Certificates"
          value={numberFormatter.format(pendingCertificates)}
          trend={`${urgentCount} urgent`}
          context="Ready for release or approval"
          statusLabel={pendingCertificates > 0 ? "Warning" : "Healthy"}
          statusTone={pendingCertificates > 0 ? "warning" : "healthy"}
          positive={pendingCertificates === 0}
        />
        <StatCard
          icon="flag"
          title="Risk Watchlist"
          value={numberFormatter.format(urgentCount + expiringSoonCount)}
          trend={`${urgentCount} critical`}
          context="Urgent and expiring delegates"
          statusLabel={urgentCount > 0 ? "Critical" : "Warning"}
          statusTone={urgentCount > 0 ? "critical" : "warning"}
          positive={false}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr),360px]">
        <DataTableCard
          title="Delegate workflow"
          description="Prioritised view of stage, certificate status, risk, and next action."
          columns={delegateColumns}
          rows={rows}
          actions={
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={
                    filteredDelegates.length > 0 &&
                    selectedIds.length === filteredDelegates.length
                  }
                  onChange={handleToggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary-soft)]"
                />
                Select all
              </label>
              <button
                type="button"
                className={ghostButtonClass}
                onClick={() => {
                  setSearch("");
                  setActiveFilter("All delegates");
                  setSelectedCompany("All companies");
                  setSelectedCourse("All courses");
                  setSelectedStatus("All statuses");
                  setSelectedIds([]);
                }}
              >
                Reset view
              </button>
            </div>
          }
        />

        <aside className={`${panelClass} overflow-hidden border-slate-200/70 bg-slate-50/35`}>
          <div className="border-b border-slate-200/80 bg-slate-50/60 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--primary)] shadow-sm">
                <AppIcon name="badge" className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                  Certification queue
                </p>
                <h2 className="mt-1 text-base font-semibold text-slate-950">
                  Action-first records
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  Sorted by urgency, with certificate and renewal actions first.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {certificationQueue.map((delegate) => {
              const queueState = getQueueState(delegate);
              const risk = getRiskStatus(delegate);

              return (
                <div
                  key={delegate.id}
                  className={`rounded-2xl border p-5 transition-all duration-200 ease-in-out hover:shadow-[var(--shadow-sm)] ${queueToneStyles[queueState.tone].container}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">
                        {delegate.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedCompany(delegate.company)}
                        className="mt-1 text-left text-sm text-[var(--primary)] transition-colors duration-150 hover:text-[var(--primary-strong)]"
                      >
                        {delegate.company}
                      </button>
                    </div>
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${queueToneStyles[queueState.tone].icon}`}
                    >
                      <AppIcon name={queueState.icon} className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusPill label={risk} tone={getRiskTone(risk)} />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {delegate.courseName} · {queueState.helper}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {getCountdownLabel(delegate)}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {getPrimaryAction(delegate) !== "Follow up" ? (
                      <button
                        type="button"
                        className={primaryButtonClass}
                        onClick={() => handlePrimaryAction(delegate)}
                        disabled={
                          getPrimaryAction(delegate) === "Mark complete" && !isAdmin
                        }
                      >
                        {getPrimaryAction(delegate)}
                      </button>
                    ) : null}
                    {delegate.followUpSent ? (
                      <span className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600">
                        Reminder sent
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => handleFollowUp(delegate)}
                      >
                        Follow up
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-sm font-medium text-[var(--primary)] transition-colors duration-200 ease-in-out hover:text-[var(--primary-strong)]"
                      onClick={() => setSelectedDelegateId(delegate.id)}
                    >
                      View details
                    </button>
                  </div>
                </div>
              );
            })}

            {certificationQueue.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-600">
                No certification records match the current filters.
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <DelegateFormModal
        key={modalOpen ? "delegate-open" : "delegate-closed"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        courses={state.courses}
        onSubmit={(input) =>
          addDelegate({
            ...input,
            certificateStatus:
              input.progress === "Completed"
                ? input.certificateStatus
                : "Pending",
          })
        }
      />

      <Modal
        open={selectedDelegate !== null}
        onClose={() => setSelectedDelegateId(null)}
        title={selectedDelegate?.name ?? "Delegate details"}
        description="Workflow, certification, and renewal status for this delegate."
        footer={
          selectedDelegate ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setSelectedDelegateId(null)}
              >
                Close
              </button>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={primaryButtonClass}
                  onClick={() => handlePrimaryAction(selectedDelegate)}
                  disabled={
                    getPrimaryAction(selectedDelegate) === "Mark complete" &&
                    !isAdmin
                  }
                >
                  {getPrimaryAction(selectedDelegate)}
                </button>
                {selectedDelegate.followUpSent ? (
                  <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600">
                    Reminder sent
                  </span>
                ) : (
                  <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={() => handleFollowUp(selectedDelegate)}
                  >
                    Follow up
                  </button>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {selectedDelegate ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className={`${panelClass} p-5`}>
              <p className={labelClass}>Delegate</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {selectedDelegate.name}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedDelegate.recordId}
              </p>
            </div>

            <div className={`${panelClass} p-5`}>
              <p className={labelClass}>Company</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {selectedDelegate.company}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCompany(selectedDelegate.company);
                  setSelectedDelegateId(null);
                }}
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] transition-colors duration-150 hover:text-[var(--primary-strong)]"
              >
                Filter by company
                <AppIcon name="arrow_up_right" className="h-4 w-4" />
              </button>
            </div>

            <div className={`${panelClass} p-5`}>
              <p className={labelClass}>Workflow</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill
                  label={
                    selectedDelegate.progress === "In training"
                      ? "Training"
                      : "Completed"
                  }
                  tone={
                    selectedDelegate.progress === "Completed"
                      ? "positive"
                      : "neutral"
                  }
                />
                <StatusPill
                  label={selectedDelegate.certificateStatus}
                  tone={
                    selectedDelegate.certificateStatus === "Issued"
                      ? "positive"
                      : "warning"
                  }
                />
                <StatusPill
                  label={getRiskStatus(selectedDelegate)}
                  tone={getRiskTone(getRiskStatus(selectedDelegate))}
                />
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Next action: {getPrimaryAction(selectedDelegate)}
              </p>
            </div>

            <div className={`${panelClass} p-5`}>
              <p className={labelClass}>Expiry</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {formatDisplayDate(selectedDelegate.expiry)}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {getCountdownLabel(selectedDelegate)}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardShell>
  );
}
