"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useSystem } from "@/components/app/SystemProvider";
import { panelClass } from "@/components/app/ui";
import { formatDisplayDate } from "@/components/app/utils";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { AppIcon } from "@/components/dashboard/icons";
import PageHeader from "@/components/dashboard/PageHeader";
import StatusPill from "@/components/dashboard/StatusPill";

function getSeatRatio(seatsFilled: number, seatsTotal: number) {
  if (seatsTotal <= 0) {
    return 0;
  }

  return seatsFilled / seatsTotal;
}

function getHealth(course: {
  owner: string;
  seatsFilled: number;
  seatsTotal: number;
}) {
  const indicators: Array<{ label: string; tone: "positive" | "warning" | "neutral" }> = [];
  const ratio = getSeatRatio(course.seatsFilled, course.seatsTotal);

  if (course.owner === "Unassigned") {
    indicators.push({ label: "Needs trainer", tone: "warning" });
  }

  if (course.seatsFilled >= course.seatsTotal) {
    indicators.push({ label: "Fully booked", tone: "neutral" });
  } else if (ratio >= 0.85) {
    indicators.push({ label: "High demand", tone: "warning" });
  } else if (ratio <= 0.4) {
    indicators.push({ label: "Low enrollment", tone: "warning" });
  } else {
    indicators.push({ label: "On track", tone: "positive" });
  }

  return indicators;
}

function getStatusTone(status: string) {
  switch (status) {
    case "Open":
    case "Scheduled":
      return "positive" as const;
    case "Review due":
      return "warning" as const;
    case "Full":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const { state } = useSystem();
  const course = state.courses.find((item) => item.id === params.courseId) ?? null;
  const delegates = useMemo(
    () =>
      course
        ? state.delegates.filter((delegate) => delegate.courseName === course.name)
        : [],
    [course, state.delegates],
  );
  const bookings = useMemo(
    () =>
      course
        ? state.bookings.filter((booking) => booking.courseName === course.name)
        : [],
    [course, state.bookings],
  );

  if (!course) {
    return (
      <DashboardShell currentPath="/courses">
        <PageHeader
          title="Course not found"
          description="The requested course record could not be found in the current session."
          actions={[
            {
              label: "Back to courses",
              href: "/courses",
              variant: "secondary",
            },
          ]}
        />
      </DashboardShell>
    );
  }

  const health = getHealth(course);

  return (
    <DashboardShell currentPath="/courses">
      <PageHeader
        title={course.name}
        description="Operational course record with delivery, capacity, trainer, and delegate context."
        actions={[
          {
            label: "Back to courses",
            href: "/courses",
            variant: "secondary",
          },
          {
            label: "Manage delegates",
            href: "/courses",
          },
        ]}
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr),380px]">
        <section className={`${panelClass} p-6`}>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[var(--primary)]">
              <AppIcon name="auto_stories" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {course.code}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{course.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{course.summary}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Category
              </p>
              <p className="mt-2 text-sm font-medium text-slate-950">{course.category}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Trainer
              </p>
              <p className="mt-2 text-sm font-medium text-slate-950">{course.owner}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Next session
              </p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {formatDisplayDate(course.nextSession)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Capacity
              </p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {course.seatsFilled} / {course.seatsTotal}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Workflow
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill label={course.status} tone={getStatusTone(course.status)} />
              {health.map((item) => (
                <StatusPill key={item.label} label={item.label} tone={item.tone} />
              ))}
            </div>
          </div>
        </section>

        <aside className={`${panelClass} p-6`}>
          <h2 className="text-base font-semibold text-slate-950">Linked activity</h2>
          <div className="mt-5 grid gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Delegates
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{delegates.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Bookings
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{bookings.length}</p>
            </div>
            <Link
              href="/bookings"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-150 hover:border-slate-400 hover:bg-slate-50"
            >
              Open bookings
            </Link>
          </div>
        </aside>
      </div>

      <section className={`${panelClass} mt-8 overflow-hidden`}>
        <div className="border-b border-slate-200/80 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-950">Assigned delegates</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            Current delegate records linked to this course.
          </p>
        </div>
        <div className="divide-y divide-slate-200/80">
          {delegates.length > 0 ? (
            delegates.map((delegate) => (
              <div key={delegate.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-950">{delegate.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{delegate.company}</p>
                </div>
                <StatusPill
                  label={delegate.progress}
                  tone={delegate.progress === "Completed" ? "positive" : "neutral"}
                />
              </div>
            ))
          ) : (
            <div className="px-6 py-5 text-sm text-slate-500">
              No delegates are currently linked to this course.
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
