"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  dangerButtonClass,
  fieldClass,
  ghostButtonClass,
  labelClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/app/ui";
import LogoutButton from "@/components/app/LogoutButton";
import { createId, matchesQuery } from "@/components/app/utils";
import { useSystem } from "@/components/app/SystemProvider";
import DashboardShell from "@/components/dashboard/DashboardShell";
import FilterBar from "@/components/dashboard/FilterBar";
import { AppIcon, type IconName } from "@/components/dashboard/icons";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusPill from "@/components/dashboard/StatusPill";

type SettingsDraft = {
  notifications: {
    expiringCertificateAlerts: boolean;
    clientEmailUpdates: boolean;
    weeklyOperationsDigest: boolean;
  };
  complianceRules: {
    expiryThresholdDays: number;
    assessmentApprovalWindowDays: number;
    autoFlagNonCompliant: boolean;
  };
  security: {
    requireMfa: boolean;
    sessionTimeout: "15 mins" | "30 mins" | "60 mins";
    passwordRotationDays: "30 days" | "60 days" | "90 days";
    restrictClientIp: boolean;
  };
  automation: {
    automationEnabled: boolean;
    autoIssueCertificates: boolean;
    bookingApprovalMode: "Manual" | "Auto-confirm low risk" | "Manager review";
    reminderCadence: "3 days" | "7 days" | "14 days";
  };
  reports: {
    reportsEnabled: boolean;
    defaultDateRange: "Last 7 days" | "Last 30 days" | "Last quarter";
    includeAuditNotes: boolean;
    autoSendClientSummaries: boolean;
    auditPackFormat: "PDF" | "PDF + CSV";
  };
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

type ChangeLogItem = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  status: "Saved" | "Applied" | "Rejected" | "Approved" | "Reset";
};

type PendingApproval = {
  id: string;
  title: string;
  type: "Policy change" | "Automation change" | "Report setting";
  requestedBy: string;
  submittedAt: string;
  priority: "High" | "Medium" | "Low";
};

type SectionKey =
  | "All settings"
  | "Security"
  | "Notifications"
  | "Automation"
  | "Reports"
  | "Compliance Rules";

const initialSettings: SettingsDraft = {
  notifications: {
    expiringCertificateAlerts: true,
    clientEmailUpdates: true,
    weeklyOperationsDigest: false,
  },
  complianceRules: {
    expiryThresholdDays: 30,
    assessmentApprovalWindowDays: 5,
    autoFlagNonCompliant: true,
  },
  security: {
    requireMfa: true,
    sessionTimeout: "30 mins",
    passwordRotationDays: "90 days",
    restrictClientIp: false,
  },
  automation: {
    automationEnabled: true,
    autoIssueCertificates: false,
    bookingApprovalMode: "Manager review",
    reminderCadence: "7 days",
  },
  reports: {
    reportsEnabled: true,
    defaultDateRange: "Last 30 days",
    includeAuditNotes: true,
    autoSendClientSummaries: false,
    auditPackFormat: "PDF + CSV",
  },
};

const initialChangeLog: ChangeLogItem[] = [
  {
    id: "log-1",
    title: "Session timeout updated",
    detail: "Security policy changed to 30 mins for internal users.",
    timestamp: "25 Mar 2026, 08:40",
    status: "Applied",
  },
  {
    id: "log-2",
    title: "Certificate alerts enabled",
    detail: "Expiry reminders re-enabled for client compliance leads.",
    timestamp: "24 Mar 2026, 16:15",
    status: "Saved",
  },
];

const initialPendingApprovals: PendingApproval[] = [
  {
    id: "approval-1",
    title: "Auto-issue certificates for low-risk completions",
    type: "Automation change",
    requestedBy: "Compliance",
    submittedAt: "Today, 09:10",
    priority: "High",
  },
  {
    id: "approval-2",
    title: "Increase expiry threshold to 45 days for offshore cohort",
    type: "Policy change",
    requestedBy: "Operations",
    submittedAt: "Today, 11:35",
    priority: "Medium",
  },
  {
    id: "approval-3",
    title: "Quarterly report window update",
    type: "Report setting",
    requestedBy: "Reporting",
    submittedAt: "Today, 15:10",
    priority: "Low",
  },
];

function countEnabledSettings(settings: SettingsDraft) {
  return [
    settings.notifications.expiringCertificateAlerts,
    settings.notifications.clientEmailUpdates,
    settings.notifications.weeklyOperationsDigest,
    settings.complianceRules.autoFlagNonCompliant,
    settings.security.requireMfa,
    settings.security.restrictClientIp,
    settings.automation.automationEnabled,
    settings.automation.autoIssueCertificates,
    settings.reports.reportsEnabled,
    settings.reports.includeAuditNotes,
    settings.reports.autoSendClientSummaries,
  ].filter(Boolean).length;
}

function formatTimestamp() {
  const now = new Date();

  return now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function validateSettings(settings: SettingsDraft) {
  const errors: string[] = [];

  if (
    Number.isNaN(settings.complianceRules.expiryThresholdDays) ||
    settings.complianceRules.expiryThresholdDays < 7 ||
    settings.complianceRules.expiryThresholdDays > 120
  ) {
    errors.push("Expiry threshold must be between 7 and 120 days.");
  }

  if (
    Number.isNaN(settings.complianceRules.assessmentApprovalWindowDays) ||
    settings.complianceRules.assessmentApprovalWindowDays < 1 ||
    settings.complianceRules.assessmentApprovalWindowDays > 30
  ) {
    errors.push("Assessment approval window must be between 1 and 30 days.");
  }

  if (!settings.security.requireMfa && settings.security.restrictClientIp) {
    errors.push("Client IP restriction cannot stay enabled while MFA is disabled.");
  }

  return errors;
}

function getSaveTone(state: SaveState) {
  switch (state) {
    case "saved":
      return "positive" as const;
    case "saving":
      return "warning" as const;
    case "error":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function getSaveLabel(state: SaveState) {
  switch (state) {
    case "dirty":
      return "You have unsaved changes";
    case "saving":
      return "Saving...";
    case "saved":
      return "Saved";
    case "error":
      return "Action required";
    default:
      return "In sync";
  }
}

function getPriorityTone(priority: PendingApproval["priority"]) {
  switch (priority) {
    case "High":
      return "danger" as const;
    case "Medium":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function getPriorityContainer(priority: PendingApproval["priority"]) {
  switch (priority) {
    case "High":
      return "border-rose-200 bg-rose-50/35";
    case "Medium":
      return "border-amber-200 bg-amber-50/35";
    default:
      return "border-slate-200 bg-slate-50/70";
  }
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-6 rounded-2xl border px-5 py-5 ${
        disabled
          ? "border-slate-200/80 bg-slate-50/50 opacity-60"
          : "border-slate-200/80 bg-slate-50/70"
      }`}
    >
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-950">{label}</h3>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all duration-150 ${
          checked
            ? "border-[var(--primary)] bg-[var(--primary)]"
            : "border-slate-300 bg-white"
        } disabled:cursor-not-allowed`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  help,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  help: string;
  disabled?: boolean;
}) {
  return (
    <label className={`grid gap-2 ${disabled ? "opacity-60" : ""}`}>
      <span className={labelClass}>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass} h-12 border-slate-200`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-sm text-slate-500">{help}</span>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  help,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
  help: string;
}) {
  return (
    <label className="grid gap-2">
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <input
          type="number"
          min={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className={`${fieldClass} h-12 border-slate-200 pr-16`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-slate-400">
          {suffix}
        </span>
      </div>
      <span className="text-sm text-slate-500">{help}</span>
    </label>
  );
}

function SectionCard({
  id,
  title,
  description,
  icon,
  permission,
  category,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  permission: string;
  category: "Critical" | "Operational" | "Reporting";
  children: ReactNode;
}) {
  const categoryTone =
    category === "Critical"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : category === "Operational"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <section id={id} className={panelClass}>
      <div className="border-b border-slate-200/80 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[var(--primary)]">
              <AppIcon name={icon} className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] ${categoryTone}`}
                >
                  {category}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold tracking-[0.04em] text-slate-600">
            {permission}
          </div>
        </div>
      </div>
      <div className="space-y-5 px-6 py-6">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { exportFile, showToast } = useSystem();
  const [appliedSettings, setAppliedSettings] = useState(initialSettings);
  const [draftSettings, setDraftSettings] = useState(initialSettings);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<SectionKey>("All settings");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [changeLog, setChangeLog] = useState(initialChangeLog);
  const [pendingApprovals, setPendingApprovals] = useState(initialPendingApprovals);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const securityRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const automationRef = useRef<HTMLDivElement | null>(null);
  const reportsRef = useRef<HTMLDivElement | null>(null);
  const complianceRef = useRef<HTMLDivElement | null>(null);

  const hasUnsavedChanges =
    JSON.stringify(draftSettings) !== JSON.stringify(appliedSettings);

  const enabledControls = countEnabledSettings(draftSettings);
  const roleFilters: SectionKey[] = [
    "All settings",
    "Security",
    "Notifications",
    "Automation",
    "Reports",
    "Compliance Rules",
  ];

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  function scrollToSection(target: SectionKey) {
    const map: Partial<Record<SectionKey, HTMLDivElement | null>> = {
      Security: securityRef.current,
      Notifications: notificationsRef.current,
      Automation: automationRef.current,
      Reports: reportsRef.current,
      "Compliance Rules": complianceRef.current,
    };

    map[target]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateDraft<K extends keyof SettingsDraft>(
    section: K,
    value: Partial<SettingsDraft[K]>,
  ) {
    setDraftSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...value,
      },
    }));
    setValidationErrors([]);
    setSaveState("dirty");
  }

  function recordChange(
    title: string,
    detail: string,
    status: ChangeLogItem["status"],
  ) {
    setChangeLog((current) => [
      {
        id: createId("change"),
        title,
        detail,
        timestamp: formatTimestamp(),
        status,
      },
      ...current,
    ]);
  }

  function handlePersist(mode: "save" | "apply") {
    const errors = validateSettings(draftSettings);
    setValidationErrors(errors);

    if (errors.length > 0) {
      setSaveState("error");
      showToast("Review the settings errors");
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    setSaveState("saving");
    saveTimerRef.current = setTimeout(() => {
      setAppliedSettings(draftSettings);
      setValidationErrors([]);
      setSaveState("saved");
      recordChange(
        mode === "save" ? "Configuration saved" : "Configuration applied",
        mode === "save"
          ? "Draft settings saved for later publishing."
          : "Settings published across the live platform.",
        mode === "save" ? "Saved" : "Applied",
      );
      showToast(mode === "save" ? "Draft saved" : "Changes applied");
      saveTimerRef.current = setTimeout(() => {
        setSaveState("idle");
      }, 1200);
    }, 650);
  }

  function handleResetDraft() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    setDraftSettings(appliedSettings);
    setValidationErrors([]);
    setSaveState("idle");
    showToast("Draft reset");
  }

  function handleDangerAction(action: "reset" | "disable" | "archive") {
    if (action === "reset") {
      setDraftSettings(initialSettings);
      setAppliedSettings(initialSettings);
      recordChange(
        "Configuration reset",
        "System configuration restored to enterprise defaults.",
        "Reset",
      );
      showToast("Configuration reset");
      return;
    }

    if (action === "disable") {
      setDraftSettings((current) => ({
        ...current,
        automation: {
          ...current.automation,
          automationEnabled: false,
          autoIssueCertificates: false,
        },
      }));
      setSaveState("dirty");
      showToast("Automation disabled in draft");
      return;
    }

    recordChange(
      "Archive requested",
      "System archive request logged for admin review.",
      "Saved",
    );
    showToast("Archive request logged");
  }

  function handleApprovalAction(id: string, action: "approve" | "reject") {
    const approval = pendingApprovals.find((item) => item.id === id);

    if (!approval) {
      return;
    }

    setPendingApprovals((current) => current.filter((item) => item.id !== id));
    recordChange(
      approval.title,
      action === "approve"
        ? `${approval.type} approved by admin control.`
        : `${approval.type} rejected and returned for revision.`,
      action === "approve" ? "Approved" : "Rejected",
    );
    showToast(action === "approve" ? "Approval granted" : "Approval rejected");
  }

  const sectionVisibility = useMemo(() => {
    const matchesSection = (section: SectionKey, values: string[]) => {
      const filterMatch = activeFilter === "All settings" || activeFilter === section;
      const searchMatch = matchesQuery(values, search);
      return filterMatch && searchMatch;
    };

    return {
      security: matchesSection("Security", [
        "Security",
        "Require MFA",
        "Session timeout",
        "Password rotation",
        "Restrict client IP",
      ]),
      notifications: matchesSection("Notifications", [
        "Notifications",
        "Expiring certificate alerts",
        "Client email updates",
        "Weekly operations digest",
      ]),
      automation: matchesSection("Automation", [
        "Automation",
        "Enable automation",
        "Auto-issue certificates",
        "Booking approval mode",
        "Reminder cadence",
      ]),
      reports: matchesSection("Reports", [
        "Reports",
        "Enable reports",
        "Default date range",
        "Include audit notes",
        "Auto-send client summaries",
        "Audit pack format",
      ]),
      complianceRules: matchesSection("Compliance Rules", [
        "Compliance Rules",
        "Expiry threshold",
        "Assessment approval window",
        "Auto-flag non-compliant delegates",
      ]),
    };
  }, [activeFilter, search]);

  const visibleSectionCount = Object.values(sectionVisibility).filter(Boolean).length;
  const displaySaveState: SaveState =
    validationErrors.length > 0
      ? "error"
      : saveState === "saving" || saveState === "saved"
        ? saveState
        : hasUnsavedChanges
          ? "dirty"
          : "idle";

  const jumpTargets = ([
    "Security",
    "Notifications",
    "Automation",
    "Reports",
    "Compliance Rules",
  ] as SectionKey[]).filter((section) =>
    search ? matchesQuery([section], search) : false,
  );

  return (
    <DashboardShell currentPath="/settings">
      <PageHeader
        title="Settings"
        description="Configure security, operational workflow, and reporting controls across the platform."
        actions={[
          {
            label: "Export config",
            variant: "secondary",
            onClick: () =>
              exportFile(
                "settings.json",
                JSON.stringify(appliedSettings, null, 2),
                "application/json;charset=utf-8",
              ),
          },
        ]}
      />

      <div className="mt-8">
        <FilterBar
          searchPlaceholder="Search settings or jump to a section"
          filters={roleFilters}
          searchValue={search}
          activeFilter={activeFilter}
          onSearchChange={setSearch}
          onFilterChange={(value) => setActiveFilter(value as SectionKey)}
          insightLabel="Configuration status"
          insightMessage={`${visibleSectionCount} sections in view. ${pendingApprovals.length} approvals are awaiting sign-off.`}
        />
      </div>

      <section className={`${panelClass} mt-6 border-slate-200/80`}>
        <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Session
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Sign out from Settings
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
              End the current session and return to the login screen from this page.
            </p>
          </div>
          <LogoutButton className={dangerButtonClass} />
        </div>
      </section>

      {jumpTargets.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.05)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Jump to section
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {jumpTargets.map((target) => (
              <button
                key={target}
                type="button"
                className={ghostButtonClass}
                onClick={() => scrollToSection(target)}
              >
                {target}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="settings"
          title="Active Controls"
          value={String(enabledControls)}
          trend={`${pendingApprovals.length} queued`}
          context="Across all modules"
          statusLabel="Healthy"
          statusTone="healthy"
        />
        <StatCard
          icon="shield"
          title="Critical Controls"
          value={draftSettings.security.requireMfa ? "Protected" : "Review"}
          trend={draftSettings.security.requireMfa ? "MFA enforced" : "MFA off"}
          context={`Timeout ${draftSettings.security.sessionTimeout}`}
          statusLabel={draftSettings.security.requireMfa ? "Healthy" : "Critical"}
          statusTone={draftSettings.security.requireMfa ? "healthy" : "critical"}
          positive={draftSettings.security.requireMfa}
        />
        <StatCard
          icon="spark"
          title="Automation"
          value={draftSettings.automation.automationEnabled ? "Enabled" : "Disabled"}
          trend={draftSettings.automation.autoIssueCertificates ? "Auto issue on" : "Manual release"}
          context="Workflow controls"
          statusLabel={draftSettings.automation.automationEnabled ? "Operational" : "Paused"}
          statusTone={draftSettings.automation.automationEnabled ? "healthy" : "warning"}
          positive={draftSettings.automation.automationEnabled}
        />
        <StatCard
          icon="file_chart"
          title="Reporting"
          value={draftSettings.reports.defaultDateRange}
          trend={draftSettings.reports.reportsEnabled ? "Reporting live" : "Reporting paused"}
          context={`Pack ${draftSettings.reports.auditPackFormat}`}
          statusLabel={draftSettings.reports.reportsEnabled ? "Healthy" : "Warning"}
          statusTone={draftSettings.reports.reportsEnabled ? "healthy" : "warning"}
          positive={draftSettings.reports.reportsEnabled}
        />
      </div>

      <div className="mt-8 grid gap-6">
        {sectionVisibility.security ? (
          <div ref={securityRef}>
            <SectionCard
              id="security"
              title="Security"
              description="Critical controls for authentication, session governance, and external access."
              icon="badge"
              permission="Admins only"
              category="Critical"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <ToggleField
                  label="Require MFA"
                  description="Enforce multi-factor authentication across staff and client accounts."
                  checked={draftSettings.security.requireMfa}
                  onChange={(value) =>
                    updateDraft("security", {
                      requireMfa: value,
                      restrictClientIp: value
                        ? draftSettings.security.restrictClientIp
                        : false,
                    })
                  }
                />
                <ToggleField
                  label="Restrict client IP"
                  description="Limit client access to approved network ranges."
                  checked={draftSettings.security.restrictClientIp}
                  disabled={!draftSettings.security.requireMfa}
                  onChange={(value) =>
                    updateDraft("security", {
                      restrictClientIp: value,
                    })
                  }
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <SelectField
                  label="Session timeout"
                  value={draftSettings.security.sessionTimeout}
                  onChange={(value) =>
                    updateDraft("security", {
                      sessionTimeout:
                        value as SettingsDraft["security"]["sessionTimeout"],
                    })
                  }
                  options={["15 mins", "30 mins", "60 mins"]}
                  help="Idle sessions close automatically after this period."
                />
                <SelectField
                  label="Password rotation"
                  value={draftSettings.security.passwordRotationDays}
                  onChange={(value) =>
                    updateDraft("security", {
                      passwordRotationDays:
                        value as SettingsDraft["security"]["passwordRotationDays"],
                    })
                  }
                  options={["30 days", "60 days", "90 days"]}
                  help="Set the renewal cycle for staff credentials."
                />
              </div>
            </SectionCard>
          </div>
        ) : null}

        {sectionVisibility.notifications ? (
          <div ref={notificationsRef}>
            <SectionCard
              id="notifications"
              title="Notifications"
              description="Operational alerting for delegates, clients, and internal teams."
              icon="notifications"
              permission="Admins and Operations"
              category="Operational"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <ToggleField
                  label="Expiring certificate alerts"
                  description="Notify compliance leads before renewal windows close."
                  checked={draftSettings.notifications.expiringCertificateAlerts}
                  onChange={(value) =>
                    updateDraft("notifications", {
                      expiringCertificateAlerts: value,
                    })
                  }
                />
                <ToggleField
                  label="Client email updates"
                  description="Send client-side updates when booking or completion status changes."
                  checked={draftSettings.notifications.clientEmailUpdates}
                  onChange={(value) =>
                    updateDraft("notifications", {
                      clientEmailUpdates: value,
                    })
                  }
                />
              </div>
              {draftSettings.notifications.clientEmailUpdates ? (
                <ToggleField
                  label="Weekly operations digest"
                  description="Deliver a weekly summary of bookings, assessments, and risk items."
                  checked={draftSettings.notifications.weeklyOperationsDigest}
                  onChange={(value) =>
                    updateDraft("notifications", {
                      weeklyOperationsDigest: value,
                    })
                  }
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                  Enable client email updates to configure weekly digest delivery.
                </div>
              )}
            </SectionCard>
          </div>
        ) : null}

        {sectionVisibility.automation ? (
          <div ref={automationRef}>
            <SectionCard
              id="automation"
              title="Automation"
              description="Operational workflow logic for bookings, reminders, and certificate release."
              icon="spark"
              permission="Admins and Operations"
              category="Operational"
            >
              <ToggleField
                label="Enable automation"
                description="Turn on workflow automation across booking approvals and certificate handling."
                checked={draftSettings.automation.automationEnabled}
                onChange={(value) =>
                  updateDraft("automation", {
                    automationEnabled: value,
                    autoIssueCertificates: value
                      ? draftSettings.automation.autoIssueCertificates
                      : false,
                  })
                }
              />
              <div className="grid gap-5 md:grid-cols-2">
                <ToggleField
                  label="Auto-issue certificates"
                  description="Issue certificates automatically after approved completion and QA checks."
                  checked={draftSettings.automation.autoIssueCertificates}
                  disabled={!draftSettings.automation.automationEnabled}
                  onChange={(value) =>
                    updateDraft("automation", {
                      autoIssueCertificates: value,
                    })
                  }
                />
                <SelectField
                  label="Reminder cadence"
                  value={draftSettings.automation.reminderCadence}
                  disabled={!draftSettings.automation.automationEnabled}
                  onChange={(value) =>
                    updateDraft("automation", {
                      reminderCadence:
                        value as SettingsDraft["automation"]["reminderCadence"],
                    })
                  }
                  options={["3 days", "7 days", "14 days"]}
                  help="Control when delegates and coordinators receive follow-up reminders."
                />
              </div>
              <SelectField
                label="Booking approval mode"
                value={draftSettings.automation.bookingApprovalMode}
                disabled={!draftSettings.automation.automationEnabled}
                onChange={(value) =>
                  updateDraft("automation", {
                    bookingApprovalMode:
                      value as SettingsDraft["automation"]["bookingApprovalMode"],
                  })
                }
                options={["Manual", "Auto-confirm low risk", "Manager review"]}
                help="Choose how booking requests move into confirmed delivery."
              />
            </SectionCard>
          </div>
        ) : null}

        {sectionVisibility.reports ? (
          <div ref={reportsRef}>
            <SectionCard
              id="reports"
              title="Reports"
              description="Reporting defaults for audit packs, exports, and client summaries."
              icon="file_chart"
              permission="Admins and Compliance"
              category="Reporting"
            >
              <ToggleField
                label="Enable reporting automation"
                description="Allow scheduled report generation and release workflows."
                checked={draftSettings.reports.reportsEnabled}
                onChange={(value) =>
                  updateDraft("reports", {
                    reportsEnabled: value,
                    autoSendClientSummaries: value
                      ? draftSettings.reports.autoSendClientSummaries
                      : false,
                  })
                }
              />
              <div className="grid gap-5 md:grid-cols-2">
                <SelectField
                  label="Default date range"
                  value={draftSettings.reports.defaultDateRange}
                  disabled={!draftSettings.reports.reportsEnabled}
                  onChange={(value) =>
                    updateDraft("reports", {
                      defaultDateRange:
                        value as SettingsDraft["reports"]["defaultDateRange"],
                    })
                  }
                  options={["Last 7 days", "Last 30 days", "Last quarter"]}
                  help="Used as the default filter when reports are generated."
                />
                <SelectField
                  label="Audit pack format"
                  value={draftSettings.reports.auditPackFormat}
                  disabled={!draftSettings.reports.reportsEnabled}
                  onChange={(value) =>
                    updateDraft("reports", {
                      auditPackFormat:
                        value as SettingsDraft["reports"]["auditPackFormat"],
                    })
                  }
                  options={["PDF", "PDF + CSV"]}
                  help="Choose the default export bundle for client and regulator reviews."
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <ToggleField
                  label="Include audit notes"
                  description="Attach internal review notes to audit-ready report packs."
                  checked={draftSettings.reports.includeAuditNotes}
                  disabled={!draftSettings.reports.reportsEnabled}
                  onChange={(value) =>
                    updateDraft("reports", {
                      includeAuditNotes: value,
                    })
                  }
                />
                <ToggleField
                  label="Auto-send client summaries"
                  description="Release scheduled summary reports to client contacts after approval."
                  checked={draftSettings.reports.autoSendClientSummaries}
                  disabled={!draftSettings.reports.reportsEnabled}
                  onChange={(value) =>
                    updateDraft("reports", {
                      autoSendClientSummaries: value,
                    })
                  }
                />
              </div>
            </SectionCard>
          </div>
        ) : null}

        {sectionVisibility.complianceRules ? (
          <div ref={complianceRef}>
            <SectionCard
              id="compliance"
              title="Compliance Rules"
              description="Thresholds and review windows for certification and audit readiness."
              icon="shield"
              permission="Admins and Compliance"
              category="Operational"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <NumberField
                  label="Expiry threshold"
                  value={draftSettings.complianceRules.expiryThresholdDays}
                  onChange={(value) =>
                    updateDraft("complianceRules", {
                      expiryThresholdDays: value,
                    })
                  }
                  suffix="days"
                  help="Delegates are flagged when certification expiry falls within this window."
                />
                <NumberField
                  label="Assessment approval window"
                  value={draftSettings.complianceRules.assessmentApprovalWindowDays}
                  onChange={(value) =>
                    updateDraft("complianceRules", {
                      assessmentApprovalWindowDays: value,
                    })
                  }
                  suffix="days"
                  help="Maximum time allowed for pending assessment sign-off."
                />
              </div>
              <ToggleField
                label="Auto-flag non-compliant delegates"
                description="Mark delegates for follow-up when mandatory activity falls outside policy."
                checked={draftSettings.complianceRules.autoFlagNonCompliant}
                onChange={(value) =>
                  updateDraft("complianceRules", {
                    autoFlagNonCompliant: value,
                  })
                }
              />
            </SectionCard>
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr),360px]">
        <section className={panelClass}>
          <div className="border-b border-slate-200/80 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[var(--primary)]">
                <AppIcon name="history_edu" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-950">Change log</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Saved, applied, and approval events for this session.
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-200/80">
            {changeLog.map((item) => (
              <div key={item.id} className="px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                  <StatusPill
                    label={item.status}
                    tone={
                      item.status === "Rejected"
                        ? "danger"
                        : item.status === "Applied" || item.status === "Approved"
                          ? "positive"
                          : "neutral"
                    }
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                  {item.timestamp}
                </p>
              </div>
            ))}
          </div>
        </section>

        <aside className={panelClass}>
          <div className="border-b border-slate-200/80 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                <AppIcon name="flag" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Pending approvals
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  High-priority configuration changes waiting for sign-off.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-5">
            {pendingApprovals.length > 0 ? (
              pendingApprovals.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${getPriorityContainer(item.priority)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {item.type}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Requested by {item.requestedBy}
                      </p>
                    </div>
                    <StatusPill label={item.priority} tone={getPriorityTone(item.priority)} />
                  </div>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                    {item.submittedAt}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={primaryButtonClass}
                      onClick={() => handleApprovalAction(item.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={() => handleApprovalAction(item.id, "reject")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-600">
                No approvals are currently waiting for review.
              </div>
            )}
          </div>
        </aside>
      </div>

      <section className={`${panelClass} mt-8 overflow-hidden border-rose-200/80`}>
        <div className="border-b border-rose-200/80 bg-rose-50/45 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-700 shadow-sm">
              <AppIcon name="flag" className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700">
                Danger zone
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-950">
                High-impact system actions
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Use only for exceptional administration, audit recovery, or platform maintenance.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-3">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/35 p-5">
            <h3 className="text-sm font-semibold text-slate-950">Reset configuration</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Restore enterprise defaults for all settings.
            </p>
            <button
              type="button"
              className={`${dangerButtonClass} mt-4`}
              onClick={() => handleDangerAction("reset")}
            >
              Reset configuration
            </button>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/35 p-5">
            <h3 className="text-sm font-semibold text-slate-950">Disable automation</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pause automated booking and certificate workflows in the draft configuration.
            </p>
            <button
              type="button"
              className={`${dangerButtonClass} mt-4`}
              onClick={() => handleDangerAction("disable")}
            >
              Disable automation
            </button>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/35 p-5">
            <h3 className="text-sm font-semibold text-slate-950">Archive system data</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Log an archival request for admin review and audit retention.
            </p>
            <button
              type="button"
              className={`${dangerButtonClass} mt-4`}
              onClick={() => handleDangerAction("archive")}
            >
              Archive system data
            </button>
          </div>
        </div>
      </section>

      {(hasUnsavedChanges || validationErrors.length > 0 || displaySaveState === "saving") ? (
        <div className="sticky bottom-0 z-40 mt-8 border-t border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-3">
              <StatusPill label={getSaveLabel(displaySaveState)} tone={getSaveTone(displaySaveState)} />
              <p className="text-sm text-slate-600">
                {hasUnsavedChanges
                  ? "You have unsaved changes. Save a draft or apply them to publish."
                  : "Resolve the validation issues before publishing."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={handleResetDraft}
              >
                Reset
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => handlePersist("save")}
              >
                Save changes
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => handlePersist("apply")}
              >
                Apply changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
