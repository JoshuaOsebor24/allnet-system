"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/app/Modal";
import { useSystem } from "@/components/app/SystemProvider";
import {
  fieldClass,
  ghostButtonClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/app/ui";
import { isWithinDays, matchesQuery, toCsv } from "@/components/app/utils";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DataTableCard, {
  type DataTableColumn,
  type DataTableRow,
} from "@/components/dashboard/DataTableCard";
import FilterBar from "@/components/dashboard/FilterBar";
import PageHeader from "@/components/dashboard/PageHeader";
import StatusPill from "@/components/dashboard/StatusPill";
import { AppIcon } from "@/components/dashboard/icons";

type ReportScope = "Training" | "Certification" | "Audit" | "Delegates";
type ReportStatus = "Ready" | "Sent" | "Pending" | "Rework";
type RiskLevel = "Low" | "Moderate" | "High";

type ReportItem = {
  id: string;
  name: string;
  description: string;
  scope: ReportScope;
  dateRange: string;
  generatedFor: string;
  updated: string;
  owner: string;
  status: ReportStatus;
  lastAction: string;
};

type CompanyBreakdownItem = {
  company: string;
  compliance: number;
  expiringCerts: number;
  risk: RiskLevel;
};

type SingleSeriesPoint = {
  label: string;
  value: number;
};

type DualSeriesPoint = {
  label: string;
  bookings: number;
  completions: number;
};

const initialReports: ReportItem[] = [
  {
    id: "report-1",
    name: "Training Completion Report",
    description:
      "Mandatory completion, attendance, and exception summary across active training cohorts.",
    scope: "Training",
    dateRange: "Last 30 days",
    generatedFor: "Allied Maritime Ltd",
    updated: "24 Mar 2026, 08:45",
    owner: "Operations",
    status: "Ready",
    lastAction: "Ready for client release after internal QA",
  },
  {
    id: "report-2",
    name: "Certification Status Report",
    description:
      "Issued, pending, and near-expiry certifications for current delegate cohorts.",
    scope: "Certification",
    dateRange: "Next 14 days",
    generatedFor: "Northgate Facilities",
    updated: "24 Mar 2026, 07:30",
    owner: "Compliance",
    status: "Sent",
    lastAction: "Sent to client after compliance sign-off",
  },
  {
    id: "report-3",
    name: "Audit Readiness Pack",
    description:
      "Evidence set covering completions, certificates, and control documentation for review.",
    scope: "Audit",
    dateRange: "Quarter to date",
    generatedFor: "Halden Energy",
    updated: "23 Mar 2026, 16:20",
    owner: "Quality",
    status: "Pending",
    lastAction: "Waiting on compliance approval before release",
  },
  {
    id: "report-4",
    name: "Delegate Activity Report",
    description:
      "Delegate movement, booking volume, attendance, and completion exceptions by cohort.",
    scope: "Delegates",
    dateRange: "Last 14 days",
    generatedFor: "Westbridge Utilities",
    updated: "24 Mar 2026, 06:55",
    owner: "Training",
    status: "Rework",
    lastAction: "Returned for amendments after review",
  },
];

const companyBreakdown: CompanyBreakdownItem[] = [
  {
    company: "Allied Maritime Ltd",
    compliance: 99.2,
    expiringCerts: 1,
    risk: "Low",
  },
  {
    company: "Northgate Facilities",
    compliance: 97.8,
    expiringCerts: 1,
    risk: "Moderate",
  },
  {
    company: "Halden Energy",
    compliance: 96.7,
    expiringCerts: 2,
    risk: "Moderate",
  },
  {
    company: "Westbridge Utilities",
    compliance: 94.8,
    expiringCerts: 3,
    risk: "High",
  },
  {
    company: "Bramley Infrastructure",
    compliance: 98.9,
    expiringCerts: 0,
    risk: "Low",
  },
];

const completionTrend: SingleSeriesPoint[] = [
  { label: "Oct", value: 94.8 },
  { label: "Nov", value: 95.7 },
  { label: "Dec", value: 96.5 },
  { label: "Jan", value: 97.2 },
  { label: "Feb", value: 97.9 },
  { label: "Mar", value: 98.4 },
];

const expiryTrend: SingleSeriesPoint[] = [
  { label: "Apr", value: 7 },
  { label: "May", value: 5 },
  { label: "Jun", value: 4 },
  { label: "Jul", value: 6 },
  { label: "Aug", value: 3 },
  { label: "Sep", value: 2 },
];

const bookingsVsCompletions: DualSeriesPoint[] = [
  { label: "W1", bookings: 182, completions: 171 },
  { label: "W2", bookings: 196, completions: 184 },
  { label: "W3", bookings: 214, completions: 206 },
  { label: "W4", bookings: 228, completions: 219 },
];

const reportColumns: DataTableColumn[] = [
  { key: "report", label: "Report" },
  { key: "dateRange", label: "Date range" },
  { key: "generatedFor", label: "Generated for" },
  { key: "updated", label: "Updated" },
  { key: "status", label: "State" },
  { key: "actions", label: "Actions", align: "right" },
];

const companyColumns: DataTableColumn[] = [
  { key: "company", label: "Company" },
  { key: "compliance", label: "Compliance" },
  { key: "expiring", label: "Expiring certs" },
  { key: "risk", label: "Risk level" },
  { key: "actions", label: "Actions", align: "right" },
];

function formatTimestamp() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function createSlug(value: string) {
  return value.toLowerCase().replaceAll("/", "-").replaceAll(" ", "-");
}

function getStatusTone(status: ReportStatus) {
  switch (status) {
    case "Ready":
      return "positive" as const;
    case "Sent":
      return "neutral" as const;
    case "Pending":
      return "warning" as const;
    default:
      return "danger" as const;
  }
}

function getRiskTone(risk: RiskLevel) {
  switch (risk) {
    case "Low":
      return "positive" as const;
    case "Moderate":
      return "warning" as const;
    default:
      return "danger" as const;
  }
}

function getScopeStyle(scope: ReportScope) {
  switch (scope) {
    case "Training":
      return {
        badge: "border-[#dbe7ff] bg-[var(--primary-soft)] text-[var(--primary)]",
        icon: "school" as const,
      };
    case "Certification":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: "badge" as const,
      };
    case "Audit":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        icon: "shield" as const,
      };
    default:
      return {
        badge: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
        icon: "groups" as const,
      };
  }
}

function getPrimaryAction(report: ReportItem) {
  switch (report.status) {
    case "Ready":
      return { label: "Send to client", disabled: false };
    case "Sent":
      return { label: "Resend", disabled: false };
    case "Pending":
      return { label: "Pending", disabled: true };
    default:
      return { label: "Edit required", disabled: false };
  }
}

function getReviewPriority(report: ReportItem) {
  if (report.status === "Rework") {
    return 0;
  }

  if (report.status === "Pending") {
    return 1;
  }

  return 2;
}

function getChartDelta(data: SingleSeriesPoint[]) {
  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const delta = last - first;
  return delta;
}

function getDualSeriesDelta(data: DualSeriesPoint[]) {
  const first = data[0];
  const last = data[data.length - 1];

  if (!first || !last) {
    return 0;
  }

  return last.completions - first.completions;
}

function SingleSeriesChartCard({
  title,
  description,
  data,
  formatter,
  insight,
  alert,
}: {
  title: string;
  description: string;
  data: SingleSeriesPoint[];
  formatter: (value: number) => string;
  insight: string;
  alert: string;
}) {
  const maxValue = Math.max(...data.map((item) => item.value));
  const peakPoint = data.reduce((peak, item) =>
    item.value > peak.value ? item : peak,
  );

  return (
    <section className={panelClass}>
      <div className="border-b border-slate-200/80 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
        <p className="mt-3 text-sm font-medium text-amber-600">{alert}</p>
        <div className="mt-3">
          <StatusPill label={insight} tone="positive" />
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mb-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          <span>Trend</span>
          <span>Peak: {peakPoint.label}</span>
        </div>
        <div className="flex h-48 items-end gap-4">
          {data.map((item, index) => (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-3">
              <span className="text-xs font-medium text-slate-500">
                {formatter(item.value)}
              </span>
              <div className="flex h-32 w-full items-end rounded-xl bg-slate-100/60 px-2 py-2">
                <div
                  className={`w-full rounded-lg transition-all duration-200 ease-in-out ${
                    item.label === peakPoint.label
                      ? "bg-[var(--primary)]"
                      : index === data.length - 1
                        ? "bg-slate-400/80"
                        : "bg-slate-300/70"
                  }`}
                  style={{
                    height: `${Math.max((item.value / maxValue) * 100, 16)}%`,
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DualSeriesChartCard({
  title,
  description,
  data,
  insight,
  alert,
}: {
  title: string;
  description: string;
  data: DualSeriesPoint[];
  insight: string;
  alert: string;
}) {
  const maxValue = Math.max(
    ...data.flatMap((item) => [item.bookings, item.completions]),
  );
  const strongestWeek = data.reduce((peak, item) =>
    item.completions > peak.completions ? item : peak,
  );

  return (
    <section className={panelClass}>
      <div className="border-b border-slate-200/80 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
        <p className="mt-3 text-sm font-medium text-amber-600">{alert}</p>
        <div className="mt-3">
          <StatusPill label={insight} tone="positive" />
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mb-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          <span>Weekly movement</span>
          <span>Best week: {strongestWeek.label}</span>
        </div>
        <div className="mb-4 flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
            Bookings
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            Completions
          </span>
        </div>
        <div className="flex h-48 items-end gap-5">
          {data.map((item) => (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-3">
              <div className="flex h-32 w-full items-end justify-center gap-2 rounded-xl bg-slate-100/60 px-3 py-2">
                <div
                  className={`w-full max-w-5 rounded-lg transition-all duration-200 ease-in-out ${
                    item.label === strongestWeek.label ? "bg-[var(--primary)]" : "bg-slate-400/80"
                  }`}
                  style={{
                    height: `${Math.max((item.bookings / maxValue) * 100, 16)}%`,
                  }}
                />
                <div
                  className="w-full max-w-5 rounded-lg bg-slate-300/70 transition-all duration-200 ease-in-out"
                  style={{
                    height: `${Math.max((item.completions / maxValue) * 100, 16)}%`,
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.bookings} / {item.completions}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExportMenu({
  onPdf,
  onCsv,
  label = "Export",
}: {
  onPdf: () => void;
  onCsv: () => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className={secondaryButtonClass}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 min-w-[150px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_28px_rgba(15,23,42,0.14)]">
          <button
            type="button"
            className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-50"
            onClick={() => {
              onPdf();
              setOpen(false);
            }}
          >
            Export PDF
          </button>
          <button
            type="button"
            className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-50"
            onClick={() => {
              onCsv();
              setOpen(false);
            }}
          >
            Export CSV
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function ReportsPage() {
  const { state, exportFile, showToast } = useSystem();
  const [reports, setReports] = useState(initialReports);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All reports");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [viewReportId, setViewReportId] = useState<string | null>(null);
  const [editReportId, setEditReportId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editDateRange, setEditDateRange] = useState("Last 30 days");
  const [editGeneratedFor, setEditGeneratedFor] = useState("");
  const [editStatus, setEditStatus] = useState<ReportStatus>("Pending");

  const complianceScore = state.summary.mandatoryTrainingCompletion;
  const compliantDelegates = Math.round(
    (state.summary.activeDelegateCount * complianceScore) / 100,
  );
  const nonCompliantDelegates =
    state.summary.activeDelegateCount - compliantDelegates;
  const expiringCertificates = state.delegates.filter((delegate) =>
    isWithinDays(delegate.expiry, 14),
  ).length;

  const filteredReports = useMemo(
    () =>
      reports.filter((report) => {
        const matchesSearch = matchesQuery(
          [
            report.name,
            report.scope,
            report.owner,
            report.description,
            report.generatedFor,
            report.status,
          ],
          search,
        );

        if (!matchesSearch) {
          return false;
        }

        if (selectedCompany && report.generatedFor !== selectedCompany) {
          return false;
        }

        switch (activeFilter) {
          case "Training":
          case "Certification":
          case "Audit":
          case "Delegates":
            return report.scope === activeFilter;
          default:
            return true;
        }
      }),
    [activeFilter, reports, search, selectedCompany],
  );

  const reviewQueue = [...filteredReports]
    .filter((report) => report.status === "Pending" || report.status === "Rework")
    .sort((left, right) => {
      const priorityDiff = getReviewPriority(left) - getReviewPriority(right);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return left.updated < right.updated ? 1 : -1;
    });

  const filteredCompanies = [...companyBreakdown]
    .filter((item) => (selectedCompany ? item.company === selectedCompany : true))
    .sort((left, right) => {
      const riskOrder = { High: 0, Moderate: 1, Low: 2 };
      const riskDiff = riskOrder[left.risk] - riskOrder[right.risk];

      if (riskDiff !== 0) {
        return riskDiff;
      }

      return left.compliance - right.compliance;
    });

  const viewReport = reports.find((report) => report.id === viewReportId) ?? null;
  const editReport = reports.find((report) => report.id === editReportId) ?? null;

  const pendingReview = reports.filter((report) => report.status === "Pending").length;
  const reworkReports = reports.filter((report) => report.status === "Rework").length;
  const readyReports = reports.filter((report) => report.status === "Ready").length;
  const sentReports = reports.filter((report) => report.status === "Sent").length;

  const completionDelta = getChartDelta(completionTrend);
  const expiryDelta = getChartDelta(expiryTrend);
  const bookingsDelta = getDualSeriesDelta(bookingsVsCompletions);

  function updateReport(
    reportId: string,
    updates: Partial<ReportItem>,
    toastMessage: string,
  ) {
    const timestamp = formatTimestamp();

    setReports((current) =>
      current.map((report) =>
        report.id === reportId
          ? { ...report, ...updates, updated: timestamp }
          : report,
      ),
    );
    showToast(toastMessage);
  }

  function openEditModal(report: ReportItem) {
    setEditReportId(report.id);
    setEditDescription(report.description);
    setEditDateRange(report.dateRange);
    setEditGeneratedFor(report.generatedFor);
    setEditStatus(report.status);
  }

  function handleExportPdf(report: ReportItem) {
    exportFile(
      `${createSlug(report.name)}.pdf`,
      [
        `${report.name}`,
        ``,
        `Generated for: ${report.generatedFor}`,
        `Date range: ${report.dateRange}`,
        `Owner: ${report.owner}`,
        `Status: ${report.status}`,
        ``,
        `${report.description}`,
      ].join("\n"),
      "application/pdf",
    );
    updateReport(
      report.id,
      {
        lastAction: "Audit-ready PDF exported",
      },
      `${report.name} PDF exported`,
    );
  }

  function handleExportCsv(report: ReportItem) {
    exportFile(
      `${createSlug(report.name)}.csv`,
      toCsv([
        ["Report", "Scope", "Date range", "Generated for", "Owner", "Status"],
        [
          report.name,
          report.scope,
          report.dateRange,
          report.generatedFor,
          report.owner,
          report.status,
        ],
      ]),
      "text/csv;charset=utf-8",
    );
    updateReport(
      report.id,
      {
        lastAction: "CSV export completed",
      },
      `${report.name} CSV exported`,
    );
  }

  function handlePrimaryAction(report: ReportItem) {
    if (report.status === "Ready") {
      updateReport(
        report.id,
        {
          status: "Sent",
          lastAction: `Sent to ${report.generatedFor}`,
        },
        `${report.name} sent to client`,
      );
      return;
    }

    if (report.status === "Sent") {
      updateReport(
        report.id,
        {
          lastAction: `Resent to ${report.generatedFor}`,
        },
        `${report.name} resent`,
      );
      return;
    }

    if (report.status === "Rework") {
      openEditModal(report);
      return;
    }

    showToast("Report is still pending review");
  }

  function handleApprove(report: ReportItem) {
    updateReport(
      report.id,
      {
        status: "Ready",
        lastAction: "Approved for client release",
      },
      `${report.name} approved`,
    );
  }

  function handleReject(report: ReportItem) {
    updateReport(
      report.id,
      {
        status: "Rework",
        lastAction: "Returned for amendments",
      },
      `${report.name} returned for rework`,
    );
  }

  const reportRows: DataTableRow[] = filteredReports.map((report) => {
    const scopeStyle = getScopeStyle(report.scope);
    const primaryAction = getPrimaryAction(report);

    return {
      id: report.id,
      onClick: () => setViewReportId(report.id),
      cells: {
        report: (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-950">{report.name}</span>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${scopeStyle.badge}`}
              >
                <AppIcon name={scopeStyle.icon} className="h-3.5 w-3.5" />
                {report.scope}
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              {report.description}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-600">
              {report.lastAction}
            </p>
          </div>
        ),
        dateRange: report.dateRange,
        generatedFor: (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedCompany(report.generatedFor);
            }}
            className="font-medium text-[var(--primary)] transition-colors duration-150 hover:text-[var(--primary-strong)]"
          >
            {report.generatedFor}
          </button>
        ),
        updated: (
          <div>
            <p className="font-medium text-slate-950">{report.updated}</p>
            <p className="mt-1 text-xs text-slate-500">{report.owner}</p>
          </div>
        ),
        status: (
          <StatusPill label={report.status} tone={getStatusTone(report.status)} />
        ),
        actions: (
          <div
            className="flex flex-wrap items-center justify-end gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            <ExportMenu
              label="Export"
              onPdf={() => handleExportPdf(report)}
              onCsv={() => handleExportCsv(report)}
            />
            <button
              type="button"
              className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none`}
              onClick={() => handlePrimaryAction(report)}
              disabled={primaryAction.disabled}
            >
              {primaryAction.label}
            </button>
          </div>
        ),
      },
    };
  });

  const companyRows: DataTableRow[] = filteredCompanies.map((company) => ({
    id: company.company,
    rowClassName:
      company.risk === "High" ? "bg-rose-50/25" : company.risk === "Moderate" ? "bg-amber-50/20" : "",
    cells: {
      company: (
        <button
          type="button"
          onClick={() => setSelectedCompany(company.company)}
          className="font-medium text-[var(--primary)] transition-colors duration-150 hover:text-[var(--primary-strong)]"
        >
          {company.company}
        </button>
      ),
      compliance: `${company.compliance.toFixed(1)}%`,
      expiring: String(company.expiringCerts).padStart(2, "0"),
      risk: <StatusPill label={company.risk} tone={getRiskTone(company.risk)} />,
      actions: (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={ghostButtonClass}
            onClick={() => setSelectedCompany(company.company)}
          >
            View details
          </button>
          <button
            type="button"
            className={ghostButtonClass}
            onClick={() => {
              setSelectedCompany(company.company);
              setActiveFilter("All reports");
            }}
          >
            Open reports
          </button>
        </div>
      ),
    },
  }));

  return (
    <DashboardShell currentPath="/reports">
      <PageHeader
        title="Reports"
        description="Review compliance reporting, client release state, and portfolio risk across active accounts."
        actions={[
          {
            label: "New review",
            onClick: () => {
              if (reviewQueue[0]) {
                setViewReportId(reviewQueue[0].id);
                return;
              }

              showToast("No reports are waiting for review");
            },
          },
        ]}
      />

      <div className="mt-8 space-y-8">
        <section className={`${panelClass} p-7`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Reporting overview
              </p>
              <h2 className="mt-2 text-[1.7rem] font-semibold tracking-tight text-slate-950">
                Reporting posture is stable, with client release risk concentrated in a small review queue.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Focus: clear pending approvals, resolve rework, and release ready packs.
              </p>
            </div>

            <ExportMenu
              label="Export"
              onPdf={() => {
                exportFile(
                  "portfolio-compliance-summary.pdf",
                  [
                    "Portfolio Compliance Summary",
                    "",
                    `Reports in view: ${filteredReports.length}`,
                    `Compliance score: ${complianceScore.toFixed(1)}%`,
                    `Expiring certifications: ${expiringCertificates}`,
                    `Pending review: ${pendingReview}`,
                  ].join("\n"),
                  "application/pdf",
                );
                showToast("Portfolio PDF exported");
              }}
              onCsv={() => {
                exportFile(
                  "portfolio-compliance-summary.csv",
                  toCsv([
                    ["Report", "Generated for", "Status", "Date range"],
                    ...filteredReports.map((report) => [
                      report.name,
                      report.generatedFor,
                      report.status,
                      report.dateRange,
                    ]),
                  ]),
                  "text/csv;charset=utf-8",
                );
                showToast("Portfolio CSV exported");
              }}
            />
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex min-h-[156px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Overall Compliance Score
              </p>
              <p className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-950">
                {complianceScore.toFixed(1)}%
              </p>
              <p className="mt-2 text-xs text-slate-600">+1.2% over the last quarter</p>
            </div>

            <div className="flex min-h-[156px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Compliant vs Non-compliant
              </p>
              <p className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-950">
                {compliantDelegates.toLocaleString("en-GB")} /{" "}
                {nonCompliantDelegates.toLocaleString("en-GB")}
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Based on {state.summary.activeDelegateCount.toLocaleString("en-GB")} live delegates
              </p>
            </div>

            <div className="flex min-h-[156px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Expiring Certifications
              </p>
              <p className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-950">
                {String(expiringCertificates).padStart(2, "0")}
              </p>
              <p className="mt-2 text-xs text-slate-600">3 require action this week</p>
            </div>

            <div className="flex min-h-[156px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Audit Readiness Status
              </p>
              <p className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-950">
                On track
              </p>
              <p className="mt-2 text-xs text-slate-600">
                {state.summary.auditPacksReady} packs ready, {reworkReports} in rework
              </p>
            </div>
          </div>
        </section>

        <section className={`${panelClass} overflow-hidden border-slate-200/80`}>
          <div className="border-b border-slate-200/80 bg-slate-50/60 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--primary)] shadow-sm">
                <AppIcon name="shield" className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                  Review queue
                </p>
                <h2 className="mt-1 text-base font-semibold text-slate-950">
                  Reports requiring action
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  Resolve rework and approvals before client release.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {reviewQueue.length > 0 ? (
              reviewQueue.map((report) => {
                const scopeStyle = getScopeStyle(report.scope);
                const urgent = report.status === "Rework";

                return (
                  <div
                    key={report.id}
                    className={`rounded-2xl border p-4 ${
                      urgent
                        ? "border-rose-200 bg-rose-50/30"
                        : "border-amber-200 bg-amber-50/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {report.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedCompany(report.generatedFor)}
                          className="mt-1 text-left text-sm text-[var(--primary)] transition-colors duration-150 hover:text-[var(--primary-strong)]"
                        >
                          {report.generatedFor}
                        </button>
                      </div>
                      <StatusPill label={report.status} tone={getStatusTone(report.status)} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${scopeStyle.badge}`}
                      >
                        <AppIcon name={scopeStyle.icon} className="h-3.5 w-3.5" />
                        {report.scope}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-700">{report.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {report.dateRange} · {report.owner}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={primaryButtonClass}
                        onClick={() => handleApprove(report)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => handleReject(report)}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="text-sm font-medium text-[var(--primary)] transition-colors duration-200 ease-in-out hover:text-[var(--primary-strong)]"
                        onClick={() => openEditModal(report)}
                      >
                        Edit required
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-600 lg:col-span-2">
                No reports are waiting on review for the current filters.
              </div>
            )}
          </div>
        </section>

        <div>
          <FilterBar
            searchPlaceholder="Search reports, companies, or report owners"
            filters={["All reports", "Training", "Certification", "Audit", "Delegates"]}
            searchValue={search}
            activeFilter={activeFilter}
            onSearchChange={setSearch}
            onFilterChange={setActiveFilter}
            insightLabel="Reporting window"
            insightMessage={`${pendingReview + reworkReports} reports still require action, ${readyReports} are ready, and ${sentReports} have already been released.`}
          />

          {selectedCompany ? (
            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Company filter
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {selectedCompany} · {filteredReports.length} reports in view
                  </p>
                </div>
                <button
                  type="button"
                  className={ghostButtonClass}
                  onClick={() => setSelectedCompany(null)}
                >
                  Clear company filter
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr),380px]">
        <DataTableCard
          title="Reporting library"
          description="Client-ready and internal report packs with a single state-driven release action."
          columns={reportColumns}
          rows={reportRows}
            actions={
              <button
                type="button"
                className={ghostButtonClass}
                onClick={() => {
                  setSearch("");
                  setActiveFilter("All reports");
                  setSelectedCompany(null);
                }}
              >
                Reset view
              </button>
            }
          />

          <div className="space-y-6">
            <SingleSeriesChartCard
              title="Training completion over time"
              description="Completion trend across monthly compliance cohorts."
              data={completionTrend}
              formatter={(value) => `${value.toFixed(1)}%`}
              insight={`${completionDelta > 0 ? "+" : ""}${completionDelta.toFixed(1)} pts`}
              alert="Completion is rising steadily with the strongest gain in the latest month."
            />
            <SingleSeriesChartCard
              title="Certification expiry trend"
              description="Certificates reaching renewal in upcoming reporting windows."
              data={expiryTrend}
              formatter={(value) => String(value)}
              insight={`${expiryDelta > 0 ? "+" : ""}${expiryDelta.toFixed(0)} change`}
              alert="Expiry pressure is dropping overall, though July still shows a renewal spike."
            />
            <DualSeriesChartCard
              title="Bookings vs completions"
              description="Weekly booking volume compared with completed delegates."
              data={bookingsVsCompletions}
              insight={`${bookingsDelta > 0 ? "+" : ""}${bookingsDelta} completions`}
              alert="Completions are improving, but booking volume is still outpacing closures."
            />
          </div>
        </section>

        <DataTableCard
          title="Company breakdown"
          description="Client risk view sorted by highest reporting and certification exposure first."
          columns={companyColumns}
          rows={companyRows}
          actions={
            selectedCompany ? (
              <button
                type="button"
                className={ghostButtonClass}
                onClick={() => setSelectedCompany(null)}
              >
                View all companies
              </button>
            ) : undefined
          }
        />
      </div>

      <Modal
        open={viewReport !== null}
        onClose={() => setViewReportId(null)}
        title={viewReport?.name ?? "Report details"}
        description="Review report scope, release state, and client distribution readiness."
        footer={
          viewReport ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setViewReportId(null)}
              >
                Close
              </button>
              <div className="flex flex-wrap gap-3">
                <ExportMenu
                  label="Export"
                  onPdf={() => handleExportPdf(viewReport)}
                  onCsv={() => handleExportCsv(viewReport)}
                />
                <button
                  type="button"
                  className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none`}
                  onClick={() => handlePrimaryAction(viewReport)}
                  disabled={getPrimaryAction(viewReport).disabled}
                >
                  {getPrimaryAction(viewReport).label}
                </button>
              </div>
            </div>
          ) : null
        }
      >
        {viewReport ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className={`${panelClass} p-5`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Report summary
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {viewReport.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill
                  label={viewReport.status}
                  tone={getStatusTone(viewReport.status)}
                />
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getScopeStyle(viewReport.scope).badge}`}
                >
                  <AppIcon
                    name={getScopeStyle(viewReport.scope).icon}
                    className="h-3.5 w-3.5"
                  />
                  {viewReport.scope}
                </span>
              </div>
            </div>

            <div className={`${panelClass} p-5`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Audience
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCompany(viewReport.generatedFor);
                  setViewReportId(null);
                }}
                className="mt-2 text-left text-base font-semibold text-[var(--primary)] transition-colors duration-150 hover:text-[var(--primary-strong)]"
              >
                {viewReport.generatedFor}
              </button>
              <p className="mt-2 text-sm text-slate-600">{viewReport.dateRange}</p>
            </div>

            <div className={`${panelClass} p-5`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Ownership
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {viewReport.owner}
              </p>
              <p className="mt-2 text-sm text-slate-600">{viewReport.updated}</p>
            </div>

            <div className={`${panelClass} p-5`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Latest action
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {viewReport.lastAction}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Current state: {viewReport.status}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={editReport !== null}
        onClose={() => setEditReportId(null)}
        title={editReport ? `Edit ${editReport.name}` : "Edit report"}
        description="Update report content, audience, and review state."
        footer={
          editReport ? (
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setEditReportId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => {
                  updateReport(
                    editReport.id,
                    {
                      description: editDescription,
                      dateRange: editDateRange,
                      generatedFor: editGeneratedFor,
                      status: editStatus,
                      lastAction: "Report details updated",
                    },
                    `${editReport.name} updated`,
                  );
                  setEditReportId(null);
                }}
              >
                Save report
              </button>
            </div>
          ) : null
        }
      >
        {editReport ? (
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 md:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Report description
              </span>
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={4}
                className={fieldClass}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Date range
              </span>
              <select
                value={editDateRange}
                onChange={(event) => setEditDateRange(event.target.value)}
                className={fieldClass}
              >
                <option value="Last 14 days">Last 14 days</option>
                <option value="Last 30 days">Last 30 days</option>
                <option value="Next 14 days">Next 14 days</option>
                <option value="Quarter to date">Quarter to date</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Generated for
              </span>
              <select
                value={editGeneratedFor}
                onChange={(event) => setEditGeneratedFor(event.target.value)}
                className={fieldClass}
              >
                {companyBreakdown.map((company) => (
                  <option key={company.company} value={company.company}>
                    {company.company}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Report state
              </span>
              <select
                value={editStatus}
                onChange={(event) => setEditStatus(event.target.value as ReportStatus)}
                className={fieldClass}
              >
                <option value="Pending">Pending</option>
                <option value="Ready">Ready</option>
                <option value="Sent">Sent</option>
                <option value="Rework">Rework</option>
              </select>
            </label>
          </div>
        ) : null}
      </Modal>
    </DashboardShell>
  );
}
