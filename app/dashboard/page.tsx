"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AUTH_STORAGE_KEY } from "@/components/app/auth";
import BookingFormModal from "@/components/app/BookingFormModal";
import {
  ghostButtonClass,
  primaryButtonClass,
} from "@/components/app/ui";
import { useSystem } from "@/components/app/SystemProvider";
import { formatDisplayDate, toCsv } from "@/components/app/utils";
import BookingRow from "@/components/dashboard/BookingRow";
import DashboardShell from "@/components/dashboard/DashboardShell";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusPill from "@/components/dashboard/StatusPill";
import { AppIcon, type IconName } from "@/components/dashboard/icons";

const dailyPerformance = [
  { label: "Mon", value: 52, bookings: 42 },
  { label: "Tue", value: 64, bookings: 51 },
  { label: "Wed", value: 58, bookings: 47 },
  { label: "Thu", value: 82, bookings: 68 },
  { label: "Fri", value: 61, bookings: 49 },
  { label: "Sat", value: 36, bookings: 28 },
  { label: "Sun", value: 41, bookings: 32 },
];

const weeklyPerformance = [
  { label: "W1", value: 48, bookings: 188 },
  { label: "W2", value: 58, bookings: 214 },
  { label: "W3", value: 71, bookings: 241 },
  { label: "W4", value: 82, bookings: 268 },
];

type PriorityTone = "warning" | "danger" | "healthy";
type QueueAction = "approve" | "assign-trainer" | "send-reminder";

const priorityToneStyles: Record<
  PriorityTone,
  { card: string; icon: string; pill: string }
> = {
  warning: {
    card: "border-amber-200 bg-amber-50/70",
    icon: "bg-amber-100 text-amber-700",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
  },
  danger: {
    card: "border-rose-200 bg-rose-50/70",
    icon: "bg-rose-100 text-rose-700",
    pill: "border-rose-200 bg-rose-50 text-rose-700",
  },
  healthy: {
    card: "border-emerald-200 bg-emerald-50/70",
    icon: "bg-emerald-100 text-emerald-700",
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

type PriorityItem = {
  id: string;
  title: string;
  helper: string;
  due: string;
  icon: IconName;
  tone: PriorityTone;
  action: QueueAction;
  href: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const {
    state,
    addBooking,
    exportFile,
    showToast,
    updateCourse,
    updateDelegate,
  } = useSystem();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activityView, setActivityView] = useState<"daily" | "weekly">("daily");
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const isAuthenticated = useSyncExternalStore(
    () => () => undefined,
    () => window.localStorage.getItem(AUTH_STORAGE_KEY) === "true",
    () => false,
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-[var(--shadow-sm)]">
            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
            Checking access...
          </div>
        </div>
      </main>
    );
  }

  const currentUser =
    state.users.find((user) => user.name === "Alex Chen") ?? state.users[0];
  const expiringDelegates = state.delegates.filter(
    (delegate) => delegate.expiry <= "2026-04-07",
  );
  const expiringCount = expiringDelegates.length;
  const pendingBookings = state.bookings.filter(
    (booking) => booking.status === "Pending",
  ).length;
  const completionReadyDelegates = state.delegates.filter(
    (delegate) =>
      delegate.progress === "Completed" &&
      delegate.certificateStatus === "Pending",
  );
  const completionReady = completionReadyDelegates.length;
  const coursesInReview = state.courses.filter(
    (course) => course.status === "Review due",
  );
  const seatsFilled = state.courses.reduce(
    (total, course) => total + course.seatsFilled,
    0,
  );
  const recentBookings = [...state.bookings]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5);
  const unassignedCourse = state.courses.find((course) => course.owner === "Unassigned");
  const queueItems: PriorityItem[] = [
    {
      id: "approve-assessments",
      title: "Approve flagged assessment outcomes",
      helper: "Certificate release is blocked by quality review.",
      due: "Today",
      icon: "flag",
      tone: completionReady > 0 ? "danger" : "healthy",
      action: "approve",
      href: "/delegates",
    },
    {
      id: "assign-trainer",
      title: "Confirm trainer allocation",
      helper: "Trainer sign-off is required before client confirmation.",
      due: "45 min",
      icon: "calendar",
      tone: unassignedCourse ? "warning" : "healthy",
      action: "assign-trainer",
      href: "/courses",
    },
    {
      id: "send-reminder",
      title: "Follow up expiring certifications",
      helper: "Renewal outreach is due before expiry windows close.",
      due: "2 hrs",
      icon: "shield",
      tone: expiringCount >= 5 ? "danger" : expiringCount > 0 ? "warning" : "healthy",
      action: "send-reminder",
      href: "/delegates",
    },
  ];
  const urgentQueueCount = queueItems.filter((item) => item.tone !== "healthy").length;

  const roleHeadline =
    currentUser?.role === "Admin"
      ? "Admin focus: approvals and reporting control."
      : currentUser?.role === "Compliance"
        ? "Compliance focus: certificate release and audit exceptions."
        : "Operations focus: delivery, sessions, and delegate follow-up.";

  const weeklyActivity = [
    {
      title: "Bookings pending",
      value: String(pendingBookings),
      helper: "Awaiting confirmation",
      icon: "confirmation_number" as const,
      iconClass: "bg-[var(--primary-soft)] text-[var(--primary)]",
      href: "/bookings",
      tone: pendingBookings >= 3 ? "warning" : "healthy",
    },
    {
      title: "Certificates awaiting release",
      value: String(completionReady),
      helper: "Moderation complete",
      icon: "badge" as const,
      iconClass: "bg-amber-50 text-amber-700",
      href: "/delegates",
      tone: completionReady >= 3 ? "warning" : "healthy",
    },
    {
      title: "Courses in review",
      value: String(coursesInReview.length),
      helper: "QA or compliance sign-off",
      icon: "task_alt" as const,
      iconClass: "bg-slate-100 text-slate-700",
      href: "/courses",
      tone: coursesInReview.length > 0 ? "warning" : "healthy",
    },
  ];

  const activityRows =
    activityView === "daily" ? dailyPerformance : weeklyPerformance;
  const peakActivity = activityRows.reduce((peak, current) =>
    current.value > peak.value ? current : peak,
  );
  const hoveredEntry =
    activityRows.find((entry) => entry.label === hoveredBar) ?? peakActivity;

  const summaryCards = [
    {
      icon: "shield" as const,
      title: "Mandatory Training Completion",
      value: `${state.summary.mandatoryTrainingCompletion.toFixed(1)}%`,
      trend: "+2% this week",
      context: "Across active client programmes",
      statusLabel: "Healthy",
      statusTone: "healthy" as const,
      positive: true,
    },
    {
      icon: "badge" as const,
      title: "Expiring Certifications",
      value: String(expiringCount).padStart(2, "0"),
      trend: `${Math.max(expiringCount - 4, 0)} overdue`,
      context: "Due within the next 14 days",
      statusLabel: expiringCount >= 5 ? "Critical" : "Warning",
      statusTone: expiringCount >= 5 ? ("critical" as const) : ("warning" as const),
      positive: false,
    },
    {
      icon: "groups" as const,
      title: "Active Delegates",
      value: String(state.summary.activeDelegateCount),
      trend: "+124 this month",
      context: "Across all compliance cohorts",
      statusLabel: "Healthy",
      statusTone: "healthy" as const,
      positive: true,
    },
    {
      icon: "file_chart" as const,
      title: "Audit Packs Ready",
      value: String(state.summary.auditPacksReady),
      trend: `${coursesInReview.length} awaiting sign-off`,
      context: "Prepared for upcoming reviews",
      statusLabel: coursesInReview.length > 0 ? "Warning" : "Healthy",
      statusTone: coursesInReview.length > 0 ? ("warning" as const) : ("healthy" as const),
      positive: coursesInReview.length === 0,
    },
    {
      icon: "confirmation_number" as const,
      title: "Seats Filled",
      value: String(seatsFilled),
      trend: `${pendingBookings} pending`,
      context: "Scheduled sessions this month",
      statusLabel: pendingBookings >= 4 ? "Warning" : "Healthy",
      statusTone: pendingBookings >= 4 ? ("warning" as const) : ("healthy" as const),
      positive: pendingBookings < 4,
    },
  ];

  const handlePriorityAction = (item: PriorityItem) => {
    if (item.action === "approve") {
      const target = completionReadyDelegates[0];

      if (!target) {
        showToast("No approvals pending");
        return;
      }

      updateDelegate(target.id, { certificateStatus: "Issued" });
      showToast(`Certificate issued for ${target.name}`);
      return;
    }

    if (item.action === "assign-trainer") {
      if (!unassignedCourse) {
        showToast("All courses already have trainers assigned");
        return;
      }

      updateCourse(unassignedCourse.id, {
        ...unassignedCourse,
        owner: "Marcus Reed",
        status: unassignedCourse.status === "Review due" ? "Scheduled" : unassignedCourse.status,
      });
      showToast(`Trainer assigned to ${unassignedCourse.name}`);
      return;
    }

    const target = expiringDelegates.find((delegate) => !delegate.followUpSent);

    if (!target) {
      showToast("No reminders pending");
      return;
    }

    updateDelegate(target.id, { followUpSent: true });
    showToast(`Reminder sent to ${target.name}`);
  };

  const latestLinks = weeklyActivity.map((item) => ({
    ...item,
    pillTone:
      item.tone === "warning" ? ("warning" as const) : ("positive" as const),
  }));

  return (
    <DashboardShell currentPath="/dashboard">
      <PageHeader
        title="Dashboard"
        description="Monitor training delivery, certification progress, and audit readiness across the organisation."
        actions={[
          {
            label: "Export report",
            variant: "secondary",
            onClick: () =>
              exportFile(
                "dashboard-summary.csv",
                toCsv([
                  ["Metric", "Value"],
                  [
                    "Mandatory training completion",
                    `${state.summary.mandatoryTrainingCompletion.toFixed(1)}%`,
                  ],
                  ["Expiring certifications", String(expiringCount)],
                  ["Active delegates", String(state.summary.activeDelegateCount)],
                  ["Audit packs ready", String(state.summary.auditPacksReady)],
                  ["Seats filled", String(seatsFilled)],
                ]),
                "text/csv;charset=utf-8",
              ),
          },
          {
            label: "New booking",
            onClick: () => setBookingModalOpen(true),
          },
        ]}
      />

      <div className="mt-8 space-y-8">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr),380px]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.05)]">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("priority-queue")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="mb-7 flex w-full items-start gap-3 rounded-[var(--radius-sm)] border border-amber-200 bg-amber-50/90 px-4 py-4 text-left shadow-[var(--shadow-sm)] transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-amber-100/80 hover:shadow-[var(--shadow-md)]"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
                <AppIcon name="flag" className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                  Today
                </p>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-800">
                  {urgentQueueCount} urgent actions need attention.
                </p>
              </div>
            </button>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
                  Compliance Health
                </p>
                <h2 className="mt-2 text-[1.7rem] font-semibold tracking-tight text-slate-950">
                  Delivery is stable. Audit readiness is under control.
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {roleHeadline}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-5 py-4 shadow-[var(--shadow-sm)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Control Center
                </p>
                <p className="mt-1 text-[1.8rem] font-semibold tracking-tight text-slate-950">
                  {urgentQueueCount}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Urgent actions open
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Completion",
                  value: `${state.summary.mandatoryTrainingCompletion.toFixed(1)}%`,
                  helper: "Healthy",
                },
                {
                  label: "Expiring",
                  value: String(expiringCount).padStart(2, "0"),
                  helper: expiringCount >= 5 ? "Critical" : "Warning",
                },
                {
                  label: "Audit packs",
                  value: String(state.summary.auditPacksReady),
                  helper: coursesInReview.length > 0 ? "Warning" : "Healthy",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="flex min-h-[148px] flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 p-5"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-950">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">{metric.helper}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            id="priority-queue"
            className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.05)]"
          >
            <div className="border-b border-slate-200/80 px-6 py-5">
              <h2 className="text-base font-semibold text-slate-950">
                Priority Queue
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Immediate operational actions
              </p>
            </div>

            <div className="space-y-3 px-5 py-5">
              {queueItems.map((item) => {
                const styles = priorityToneStyles[item.tone];

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(item.href)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(item.href);
                      }
                    }}
                    className={`cursor-pointer rounded-xl border p-4 shadow-[var(--shadow-sm)] transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${styles.card}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
                      >
                        <AppIcon name={item.icon} className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-slate-950">
                            {item.title}
                          </h3>
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.04em] ${styles.pill}`}
                          >
                            {item.due}
                          </span>
                        </div>

                        <p className="mt-1.5 text-sm leading-6 text-slate-600">
                          {item.helper}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className={primaryButtonClass}
                            onClick={(event) => {
                              event.stopPropagation();
                              handlePriorityAction(item);
                            }}
                          >
                            {item.action === "approve"
                              ? "Approve"
                              : item.action === "assign-trainer"
                                ? "Assign trainer"
                                : "Send reminder"}
                          </button>
                          <button
                            type="button"
                            className={ghostButtonClass}
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(item.href);
                            }}
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <StatCard
              key={card.title}
              {...card}
              context={
                card.title === "Mandatory Training Completion"
                  ? "Active programmes"
                  : card.title === "Expiring Certifications"
                    ? "Next 14 days"
                    : card.title === "Active Delegates"
                      ? "Current cohorts"
                      : card.title === "Audit Packs Ready"
                        ? "Upcoming reviews"
                        : "This month"
              }
            />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr),360px]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Training Activity
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                  Bookings and attendance over the past 7 days
                </p>
              </div>
              <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setActivityView("daily")}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-200 ease-in-out ${
                    activityView === "daily"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setActivityView("weekly")}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-200 ease-in-out ${
                    activityView === "weekly"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Hover insight
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {hoveredEntry.label}: {hoveredEntry.bookings} bookings
                  </p>
                </div>
                <StatusPill label={`Peak ${peakActivity.label}`} tone="warning" />
              </div>
            </div>

            <div className="mt-7 transition-all duration-200 ease-in-out">
              <div className="mb-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                <span>Booking volume</span>
                <span>{activityView === "daily" ? "Days" : "Weeks"}</span>
              </div>
              <div className="flex gap-4">
                <div className="flex h-64 flex-col justify-between pb-7 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span>80</span>
                  <span>40</span>
                  <span>0</span>
                </div>
                <div
                  className={`grid h-64 flex-1 items-end gap-3 ${
                    activityView === "daily" ? "grid-cols-7" : "grid-cols-4"
                  }`}
                >
                  {activityRows.map((entry) => (
                    <ChartBar
                      key={entry.label}
                      label={entry.label}
                      value={entry.value}
                      bookings={entry.bookings}
                      active={entry.label === peakActivity.label}
                      hovered={hoveredBar === entry.label}
                      onHover={() => setHoveredBar(entry.label)}
                      onLeave={() => setHoveredBar(null)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-200/80 pb-5">
              <h2 className="text-base font-semibold text-slate-950">
                Latest Activity
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Click through to the relevant work queue
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {latestLinks.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="block rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 transition-all duration-200 ease-in-out hover:border-slate-300 hover:bg-white hover:shadow-[var(--shadow-sm)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconClass}`}
                      >
                        <AppIcon name={item.icon} className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.helper}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-semibold tracking-tight text-slate-950">
                        {item.value}
                      </span>
                      <div className="mt-2">
                        <StatusPill
                          label={item.tone === "warning" ? "Warning" : "Healthy"}
                          tone={item.pillTone}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 border-b border-slate-200/80 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Recent Bookings
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Latest booking activity
              </p>
            </div>
            <Link
              href="/bookings"
              className="inline-flex items-center text-sm font-medium text-[var(--primary)] transition-colors duration-200 ease-in-out hover:text-[var(--primary-strong)]"
            >
              View all
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Delegate
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Course
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Date
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80">
                {recentBookings.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    initials={booking.delegateName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                    initialsBg="bg-blue-100"
                    initialsText="text-blue-800"
                    name={booking.delegateName}
                    course={booking.courseName}
                    date={formatDisplayDate(booking.date)}
                    status={booking.status}
                    statusType={booking.status === "Pending" ? "pending" : "completed"}
                    href="/bookings"
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={() =>
          document
            .getElementById("priority-queue")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        className="fixed bottom-6 left-6 z-20 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-700 shadow-[var(--shadow-lg)] transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-amber-50"
      >
        <AppIcon name="flag" className="h-4 w-4" />
        {urgentQueueCount} urgent issue{urgentQueueCount === 1 ? "" : "s"}
      </button>

      <BookingFormModal
        key={bookingModalOpen ? "dashboard-booking-open" : "dashboard-booking-closed"}
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title="Create booking"
        delegates={state.delegates}
        courses={state.courses}
        onSubmit={(input) => addBooking(input)}
      />
    </DashboardShell>
  );
}

type ChartBarProps = {
  label: string;
  value: number;
  bookings: number;
  active: boolean;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
};

function ChartBar({
  label,
  value,
  bookings,
  active,
  hovered,
  onHover,
  onLeave,
}: ChartBarProps) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onFocus={onHover}
      onMouseLeave={onLeave}
      onBlur={onLeave}
      className="group flex h-full flex-col justify-end text-left transition-all duration-200 ease-in-out"
      aria-label={`${label}: ${bookings} bookings`}
      title={`${label}: ${bookings} bookings`}
    >
      <div
        className={`mb-2 text-center text-xs font-medium transition-colors duration-200 ease-in-out ${
          hovered || active ? "text-[var(--primary)]" : "text-slate-500"
        }`}
      >
        {bookings}
      </div>
      <div className="relative h-52 rounded-t-lg bg-slate-100 transition-all duration-200 ease-in-out group-hover:bg-slate-200/80">
        <div
          className={`absolute inset-x-0 bottom-0 rounded-t-lg transition-all duration-200 ease-in-out ${
            active
              ? "bg-[var(--primary)]"
              : hovered
                ? "bg-slate-400 shadow-[0_0_0_2px_rgba(11,60,145,0.08)]"
                : "bg-slate-300"
          }`}
          style={{ height: `${value}%` }}
        />
      </div>
      <span className="mt-3 text-center text-xs font-medium text-slate-500">
        {label}
      </span>
      {active ? (
        <span className="mt-1 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
          Peak
        </span>
      ) : null}
    </button>
  );
}
