"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/app/Modal";
import CourseFormModal from "@/components/app/CourseFormModal";
import { useSystem, type Course, type CourseStatus } from "@/components/app/SystemProvider";
import {
  fieldClass,
  ghostButtonClass,
  labelClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/app/ui";
import { formatDisplayDate, matchesQuery, toCsv, toDateInputValue } from "@/components/app/utils";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DataTableCard, {
  type DataTableColumn,
  type DataTableRow,
} from "@/components/dashboard/DataTableCard";
import FilterBar from "@/components/dashboard/FilterBar";
import { AppIcon } from "@/components/dashboard/icons";
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusPill from "@/components/dashboard/StatusPill";

type PublishingQueueItem = {
  courseId: string;
  note: string;
  priority: "High" | "Medium";
};

const courseColumns: DataTableColumn[] = [
  { key: "course", label: "Course" },
  { key: "category", label: "Category" },
  { key: "trainer", label: "Trainer" },
  { key: "nextSession", label: "Next session" },
  { key: "seats", label: "Seats", align: "right" },
  { key: "status", label: "Status", align: "right" },
  { key: "priority", label: "Priority", align: "right" },
  { key: "actions", label: "Actions", align: "right" },
];

function getSeatRatio(course: Course) {
  if (course.seatsTotal <= 0) {
    return 0;
  }

  return course.seatsFilled / course.seatsTotal;
}

function getSeatState(course: Course) {
  const ratio = getSeatRatio(course);

  if (course.seatsFilled >= course.seatsTotal) {
    return {
      label: "Full",
      tone: "danger" as const,
      barClass: "bg-rose-500",
      textClass: "text-rose-700",
    };
  }

  if (ratio >= 0.85) {
    return {
      label: "Almost full",
      tone: "warning" as const,
      barClass: "bg-amber-500",
      textClass: "text-amber-700",
    };
  }

  return {
    label: "Available",
    tone: "positive" as const,
    barClass: "bg-emerald-500",
    textClass: "text-emerald-700",
  };
}

function getHealthIndicators(course: Course) {
  const indicators: Array<{
    label: string;
    tone: "positive" | "warning" | "danger" | "neutral";
    icon: "trending_up" | "trending_down" | "flag" | "confirmation_number";
  }> = [];
  const ratio = getSeatRatio(course);
  const trainerAssigned = course.owner.trim().length > 0 && course.owner !== "Unassigned";

  if (!trainerAssigned) {
    indicators.push({ label: "Needs trainer", tone: "warning", icon: "flag" });
  }

  if (course.seatsFilled >= course.seatsTotal) {
    indicators.push({ label: "Fully booked", tone: "neutral", icon: "confirmation_number" });
  } else if (ratio >= 0.85) {
    indicators.push({ label: "High demand", tone: "warning", icon: "trending_up" });
  } else if (ratio <= 0.4) {
    indicators.push({ label: "Low enrollment", tone: "warning", icon: "trending_down" });
  }

  return indicators.slice(0, 2);
}

function getCapacityStatus(course: Course) {
  if (course.seatsFilled >= course.seatsTotal) {
    return "Fully booked";
  }

  if (getSeatRatio(course) >= 0.85) {
    return "High demand";
  }

  if (getSeatRatio(course) <= 0.4) {
    return "Low enrollment";
  }

  return "Available";
}

function getStatusTone(status: CourseStatus) {
  switch (status) {
    case "Open":
      return "positive" as const;
    case "Full":
      return "danger" as const;
    case "Review due":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function getPriorityTone(label: string) {
  switch (label) {
    case "High demand":
      return "warning" as const;
    case "Fully booked":
      return "danger" as const;
    case "Needs trainer":
    case "Low enrollment":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function getCourseStatusAfterCapacity(
  course: Course,
  overrides?: Partial<Pick<Course, "seatsFilled" | "seatsTotal" | "status">>,
): CourseStatus {
  const seatsFilled = overrides?.seatsFilled ?? course.seatsFilled;
  const seatsTotal = overrides?.seatsTotal ?? course.seatsTotal;
  const explicitStatus = overrides?.status ?? course.status;

  if (explicitStatus === "Completed" || explicitStatus === "Review due") {
    return explicitStatus;
  }

  if (seatsFilled >= seatsTotal) {
    return "Full";
  }

  if (explicitStatus === "In progress" || explicitStatus === "Scheduled") {
    return explicitStatus;
  }

  return "Open";
}

export default function CoursesPage() {
  const router = useRouter();
  const {
    state,
    addBooking,
    addCourse,
    updateCourse,
    exportFile,
    showToast,
  } = useSystem();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All courses");
  const [capacityFilter, setCapacityFilter] = useState("All capacity");
  const [trainerFilter, setTrainerFilter] = useState("All trainers");
  const [sessionFilter, setSessionFilter] = useState("All sessions");
  const [editingCourse, setEditingCourse] = useState<Course | undefined>();
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [trainerCourse, setTrainerCourse] = useState<Course | undefined>();
  const [trainerName, setTrainerName] = useState("");
  const [sessionCourse, setSessionCourse] = useState<Course | undefined>();
  const [sessionDate, setSessionDate] = useState("2026-03-31");
  const [sessionSeats, setSessionSeats] = useState("16");
  const [sessionStatus, setSessionStatus] = useState<CourseStatus>("Scheduled");
  const [delegatesCourse, setDelegatesCourse] = useState<Course | undefined>();
  const [selectedDelegate, setSelectedDelegate] = useState("");
  const [bookingType, setBookingType] = useState<"Virtual" | "In-person">("Virtual");
  const [bookingDate, setBookingDate] = useState("2026-03-31");
  const [menuCourseId, setMenuCourseId] = useState<string | null>(null);
  const [commentCourse, setCommentCourse] = useState<Course | undefined>();
  const [queueComment, setQueueComment] = useState("");
  const [publishingQueue, setPublishingQueue] = useState<PublishingQueueItem[]>([
    {
      courseId: "course-4",
      note: "Trainer assignment is pending before publication can be released.",
      priority: "High",
    },
    {
      courseId: "course-3",
      note: "Low enrollment needs approval before external publishing.",
      priority: "Medium",
    },
  ]);

  const trainerOptions = Array.from(
    new Set(state.courses.map((course) => (course.owner === "Unassigned" ? "Unassigned" : course.owner))),
  );

  const filteredCourses = state.courses.filter((course) => {
    const healthLabels = getHealthIndicators(course).map((item) => item.label);
    const matchesSearch = matchesQuery(
      [
        course.name,
        course.code,
        course.owner,
        course.category,
        course.summary,
        ...healthLabels,
      ],
      search,
    );

    if (!matchesSearch) {
      return false;
    }

    if (capacityFilter !== "All capacity" && getCapacityStatus(course) !== capacityFilter) {
      return false;
    }

    if (
      trainerFilter !== "All trainers" &&
      (trainerFilter === "Assigned"
        ? course.owner === "Unassigned"
        : trainerFilter === "Unassigned"
          ? course.owner !== "Unassigned"
          : course.owner !== trainerFilter)
    ) {
      return false;
    }

    if (sessionFilter === "Upcoming sessions") {
      if (!(course.nextSession >= "2026-03-25" && course.nextSession <= "2026-04-07")) {
        return false;
      }
    }

    switch (activeFilter) {
      case "Privacy":
      case "Data Protection":
      case "Information Security":
        return course.category === activeFilter;
      case "Review due":
        return course.status === "Review due";
      case "Capacity issues":
        return getSeatRatio(course) >= 0.85 || course.seatsFilled >= course.seatsTotal;
      default:
        return true;
    }
  });

  const highDemandCount = state.courses.filter((course) => {
    const ratio = getSeatRatio(course);
    return ratio >= 0.85 && course.seatsFilled < course.seatsTotal;
  }).length;
  const fullyBookedCount = state.courses.filter(
    (course) => course.seatsFilled >= course.seatsTotal,
  ).length;
  const lowEnrollmentCount = state.courses.filter(
    (course) => getSeatRatio(course) <= 0.4 && course.seatsFilled < course.seatsTotal,
  ).length;
  const reviewDue = state.courses.filter((course) => course.status === "Review due").length;
  const unassignedTrainerCount = state.courses.filter(
    (course) => course.owner === "Unassigned",
  ).length;
  const capacityIssueCount = state.courses.filter((course) => {
    const ratio = getSeatRatio(course);
    return ratio >= 0.85 || course.seatsFilled >= course.seatsTotal;
  }).length;

  const rows: DataTableRow[] = filteredCourses.map((course) => {
    const seatState = getSeatState(course);
    const healthIndicators = getHealthIndicators(course);
    const primaryPriority = healthIndicators[0];

    return {
      id: course.id,
      onClick: () => router.push(`/courses/${course.id}`),
      cells: {
        course: (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[var(--primary)]">
              <AppIcon name="auto_stories" className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-950">{course.name}</p>
              <p className="text-xs text-slate-500">
                {course.code} · {course.summary}
              </p>
              {healthIndicators.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {healthIndicators.map((indicator) => (
                    <span
                      key={`${course.id}-${indicator.label}`}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] ${
                        indicator.label === "High demand"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : indicator.label === "Low enrollment"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : indicator.label === "Fully booked"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      <AppIcon name={indicator.icon} className="h-3.5 w-3.5" />
                      {indicator.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ),
        category: course.category,
        trainer: (
          <span
            className={
              course.owner === "Unassigned" ? "font-medium text-amber-700" : "text-slate-700"
            }
          >
            {course.owner}
          </span>
        ),
        nextSession: formatDisplayDate(course.nextSession),
        seats: (
          <div className="ml-auto w-[150px] text-left">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-950">
                {course.seatsFilled} / {course.seatsTotal}
              </span>
              <span className={`text-xs font-medium ${seatState.textClass}`}>
                {seatState.label}
              </span>
            </div>
            <div className="mt-2.5 h-3 rounded-full bg-slate-100">
              <div
                className={`h-3 rounded-full transition-all duration-200 ease-in-out ${seatState.barClass}`}
                style={{
                  width: `${Math.min(100, Math.round(getSeatRatio(course) * 100))}%`,
                }}
              />
            </div>
          </div>
        ),
        status: <StatusPill label={course.status} tone={getStatusTone(course.status)} />,
        priority: primaryPriority ? (
          <StatusPill label={primaryPriority.label} tone={getPriorityTone(primaryPriority.label)} />
        ) : (
          <StatusPill label="On track" tone="positive" />
        ),
        actions: (
          <div
            className="flex flex-wrap items-center justify-end gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={`${primaryButtonClass} px-3.5 py-2 text-xs`}
              onClick={() => {
                setDelegatesCourse(course);
                setSelectedDelegate(state.delegates[0]?.name ?? "");
                setBookingDate(toDateInputValue(course.nextSession));
                setBookingType("Virtual");
              }}
            >
              Manage delegates
            </button>
            <div className="relative">
              <button
                type="button"
                className={`${ghostButtonClass} px-3.5 py-2 text-xs`}
                onClick={() =>
                  setMenuCourseId((current) => (current === course.id ? null : course.id))
                }
              >
                View details
              </button>
              {menuCourseId === course.id ? (
                <div className="absolute right-0 z-20 mt-2 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_28px_rgba(15,23,42,0.14)]">
                  <button
                    type="button"
                    className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-50"
                    onClick={() => {
                      setMenuCourseId(null);
                      router.push(`/courses/${course.id}`);
                    }}
                  >
                    View course
                  </button>
                  <button
                    type="button"
                    className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-50"
                    onClick={() => {
                      setMenuCourseId(null);
                      setTrainerCourse(course);
                      setTrainerName(course.owner === "Unassigned" ? "" : course.owner);
                    }}
                  >
                    Assign trainer
                  </button>
                  <button
                    type="button"
                    className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-50"
                    onClick={() => {
                      setMenuCourseId(null);
                      setSessionCourse(course);
                      setSessionDate(toDateInputValue(course.nextSession));
                      setSessionSeats(String(course.seatsTotal));
                      setSessionStatus(course.status === "Completed" ? "Scheduled" : course.status);
                    }}
                  >
                    Add session
                  </button>
                  <button
                    type="button"
                    className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-50"
                    onClick={() => {
                      setMenuCourseId(null);
                      setEditingCourse(course);
                      setCourseModalOpen(true);
                    }}
                  >
                    Edit course
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ),
      },
    };
  });

  const visibleQueue = publishingQueue
    .map((item) => ({
      item,
      course: state.courses.find((course) => course.id === item.courseId),
    }))
    .filter((entry) => entry.course);

  return (
    <DashboardShell currentPath="/courses">
      <PageHeader
        title="Courses"
        description="Manage course delivery, trainer allocation, capacity, and publishing readiness across the training catalogue."
        actions={[
          {
            label: "Export list",
            variant: "secondary",
            onClick: () =>
              exportFile(
                "courses.csv",
                toCsv([
                  [
                    "Code",
                    "Course",
                    "Category",
                    "Trainer",
                    "Next session",
                    "Seats",
                    "Status",
                  ],
                  ...filteredCourses.map((course) => [
                    course.code,
                    course.name,
                    course.category,
                    course.owner,
                    formatDisplayDate(course.nextSession),
                    `${course.seatsFilled}/${course.seatsTotal}`,
                    course.status,
                  ]),
                ]),
                "text/csv;charset=utf-8",
              ),
          },
          {
            label: "Create new session",
            onClick: () => {
              const course = state.courses[0];

              if (!course) {
                showToast("No courses available");
                return;
              }

              setSessionCourse(course);
              setSessionDate(toDateInputValue(course.nextSession));
              setSessionSeats(String(course.seatsTotal));
              setSessionStatus("Scheduled");
            },
          },
        ]}
      />

      <div className="mt-8">
        <FilterBar
          searchPlaceholder="Search courses, trainers, or health indicators"
          filters={[
            "All courses",
            "Privacy",
            "Data Protection",
            "Information Security",
            "Capacity issues",
            "Review due",
          ]}
          searchValue={search}
          activeFilter={activeFilter}
          onSearchChange={setSearch}
          onFilterChange={setActiveFilter}
          insightLabel="Operations focus"
          insightMessage={`${capacityIssueCount} courses need capacity attention. ${visibleQueue.length} items are waiting in the publishing queue.`}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <label className="grid gap-2">
          <span className={`${labelClass} text-slate-600`}>Capacity status</span>
          <select
            value={capacityFilter}
            onChange={(event) => setCapacityFilter(event.target.value)}
            className={`${fieldClass} h-12`}
          >
            <option value="All capacity">All capacity</option>
            <option value="High demand">High demand</option>
            <option value="Low enrollment">Low enrollment</option>
            <option value="Fully booked">Fully booked</option>
            <option value="Available">Available</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className={`${labelClass} text-slate-600`}>Trainer assignment</span>
          <select
            value={trainerFilter}
            onChange={(event) => setTrainerFilter(event.target.value)}
            className={`${fieldClass} h-12`}
          >
            <option value="All trainers">All trainers</option>
            <option value="Assigned">Assigned</option>
            <option value="Unassigned">Unassigned</option>
            {trainerOptions
              .filter((trainer) => trainer !== "Unassigned")
              .map((trainer) => (
                <option key={trainer} value={trainer}>
                  {trainer}
                </option>
              ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className={`${labelClass} text-slate-600`}>Session timing</span>
          <select
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value)}
            className={`${fieldClass} h-12`}
          >
            <option value="All sessions">All sessions</option>
            <option value="Upcoming sessions">Upcoming sessions</option>
          </select>
        </label>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="confirmation_number"
          title="Fully Booked"
          value={String(fullyBookedCount)}
          context="Capacity allocated"
        />
        <StatCard
          icon="trending_up"
          title="High Demand"
          value={String(highDemandCount)}
          context="Near capacity"
        />
        <StatCard
          icon="trending_down"
          title="Low Enrollment"
          value={String(lowEnrollmentCount)}
          context="Below fill target"
          positive={false}
        />
        <StatCard
          icon="task_alt"
          title="Review Due"
          value={String(reviewDue)}
          context="Awaiting sign-off"
          positive={false}
        />
      </div>

      <section className={`${panelClass} mt-8 px-6 py-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Quick actions</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              {unassignedTrainerCount > 0
                ? `${unassignedTrainerCount} courses still need a trainer assignment.`
                : reviewDue > 0
                  ? `${reviewDue} courses are waiting on review before release.`
                  : "Capacity and publishing are on track across the catalogue."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => {
                const unassignedCourse =
                  state.courses.find((course) => course.owner === "Unassigned") ??
                  state.courses[0];

                if (!unassignedCourse) {
                  showToast("No courses available");
                  return;
                }

                setTrainerCourse(unassignedCourse);
                setTrainerName(
                  unassignedCourse.owner === "Unassigned" ? "" : unassignedCourse.owner,
                );
              }}
            >
              {unassignedTrainerCount > 0 ? "Assign trainer now" : "Reassign trainer"}
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => {
                const targetCourse =
                  state.courses.find((course) => course.status === "Review due") ??
                  state.courses[0];

                if (!targetCourse) {
                  showToast("No courses available");
                  return;
                }

                setSessionCourse(targetCourse);
                setSessionDate(toDateInputValue(targetCourse.nextSession));
                setSessionSeats(String(targetCourse.seatsTotal));
                setSessionStatus(targetCourse.status === "Completed" ? "Scheduled" : targetCourse.status);
              }}
            >
              Add session
            </button>
            <button
              type="button"
              className={capacityIssueCount > 0 ? primaryButtonClass : secondaryButtonClass}
              onClick={() => {
                setActiveFilter("Capacity issues");
                showToast("Capacity issues filtered");
              }}
            >
              {capacityIssueCount > 0 ? "View capacity issues" : "Capacity healthy"}
            </button>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr),340px]">
        {state.courses.length === 0 ? (
          <section className={`${panelClass} flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center`}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[var(--primary)]">
              <AppIcon name="auto_stories" className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-950">No courses in the catalogue</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Add a course to start scheduling sessions, assigning trainers, and managing delegate capacity.
            </p>
            <button
              type="button"
              className={`${primaryButtonClass} mt-5`}
              onClick={() => {
                setEditingCourse(undefined);
                setCourseModalOpen(true);
              }}
            >
              Add first course
            </button>
          </section>
        ) : (
        <DataTableCard
          title="Training catalogue"
          description="Live operational view of trainer coverage, capacity, status, and next-session readiness."
          columns={courseColumns}
          rows={rows}
          actions={
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() => {
                setSearch("");
                setActiveFilter("All courses");
                setCapacityFilter("All capacity");
                setTrainerFilter("All trainers");
                setSessionFilter("All sessions");
              }}
            >
              Reset view
            </button>
          }
        />
        )}

        <aside className={`${panelClass} border-slate-200/70 bg-slate-50/40`}>
          <div className="border-b border-slate-200/80 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-950">
              Publishing queue
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              Review publishing decisions before courses go live for booking.
            </p>
          </div>

          <div className="space-y-3 px-4 py-4">
            {visibleQueue.length > 0 ? (
              visibleQueue.map(({ item, course }) =>
                course ? (
                  <div
                    key={item.courseId}
                    className="rounded-xl border border-slate-200/80 bg-white px-5 py-5 shadow-[var(--shadow-sm)] transition-all duration-200 ease-in-out hover:shadow-[var(--shadow-md)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                          {course.name}
                        </h3>
                        <p className="mt-1.5 text-sm leading-6 text-slate-600">
                          {item.note}
                        </p>
                      </div>
                      <StatusPill
                        label={item.priority}
                        tone={item.priority === "High" ? "warning" : "neutral"}
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                      {course.owner} · {formatDisplayDate(course.nextSession)}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={ghostButtonClass}
                        onClick={() => router.push(`/courses/${course.id}`)}
                      >
                        View course
                      </button>
                      <button
                        type="button"
                        className={ghostButtonClass}
                        onClick={() => {
                          setEditingCourse(course);
                          setCourseModalOpen(true);
                        }}
                      >
                        Edit before approve
                      </button>
                      <button
                        type="button"
                        className={ghostButtonClass}
                        onClick={() => {
                          setCommentCourse(course);
                          setQueueComment(item.note);
                        }}
                      >
                        Comment
                      </button>
                      <button
                        type="button"
                        className={primaryButtonClass}
                        onClick={() => {
                          updateCourse(course.id, {
                            ...course,
                            status: getCourseStatusAfterCapacity(course, {
                              status: "Scheduled",
                            }),
                          });
                          setPublishingQueue((current) =>
                            current.filter((entry) => entry.courseId !== course.id),
                          );
                          showToast("Publishing approved");
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={ghostButtonClass}
                        onClick={() => {
                          updateCourse(course.id, { ...course, status: "Review due" });
                          setPublishingQueue((current) =>
                            current.filter((entry) => entry.courseId !== course.id),
                          );
                          showToast("Returned for review");
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ) : null,
              )
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-5 text-sm text-slate-500">
                No courses are waiting in the publishing queue.
              </div>
            )}
          </div>
        </aside>
      </div>

      <CourseFormModal
        key={courseModalOpen ? `course-${editingCourse?.id ?? "new"}` : "course-closed"}
        open={courseModalOpen}
        onClose={() => {
          setCourseModalOpen(false);
          setEditingCourse(undefined);
        }}
        initialValue={editingCourse}
        onSubmit={(input) => {
          if (editingCourse) {
            updateCourse(editingCourse.id, {
              ...input,
              owner: input.owner.trim().length > 0 ? input.owner : "Unassigned",
              status: getCourseStatusAfterCapacity(
                { ...editingCourse, ...input, owner: input.owner.trim().length > 0 ? input.owner : "Unassigned" },
                {
                  seatsFilled: input.seatsFilled,
                  seatsTotal: input.seatsTotal,
                  status: input.status,
                },
              ),
            });
            return;
          }

          addCourse({
            ...input,
            owner: input.owner.trim().length > 0 ? input.owner : "Unassigned",
            status: getCourseStatusAfterCapacity(
              { id: "draft", ...input, owner: input.owner.trim().length > 0 ? input.owner : "Unassigned" },
              {
                seatsFilled: input.seatsFilled,
                seatsTotal: input.seatsTotal,
                status: input.status,
              },
            ),
          });
        }}
      />

      <Modal
        open={Boolean(trainerCourse)}
        onClose={() => {
          setTrainerCourse(undefined);
          setTrainerName("");
        }}
        title={trainerCourse ? `Assign trainer: ${trainerCourse.name}` : "Assign trainer"}
        description="Update trainer ownership for this course."
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => {
                setTrainerCourse(undefined);
                setTrainerName("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => {
                if (!trainerCourse || trainerName.trim().length === 0) {
                  showToast("Enter a trainer name");
                  return;
                }

                updateCourse(trainerCourse.id, {
                  ...trainerCourse,
                  owner: trainerName.trim(),
                  status:
                    trainerCourse.status === "Review due"
                      ? "Scheduled"
                      : trainerCourse.status,
                });
                setTrainerCourse(undefined);
                setTrainerName("");
                showToast("Trainer assigned");
              }}
            >
              Save trainer
            </button>
          </div>
        }
      >
        <label className="grid gap-2">
          <span className={labelClass}>Trainer name</span>
          <input
            value={trainerName}
            onChange={(event) => setTrainerName(event.target.value)}
            className={fieldClass}
            placeholder="Enter trainer name"
          />
        </label>
      </Modal>

      <Modal
        open={Boolean(sessionCourse)}
        onClose={() => setSessionCourse(undefined)}
        title={sessionCourse ? `Add session: ${sessionCourse.name}` : "Create new session"}
        description="Schedule the next delivery window and update capacity."
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setSessionCourse(undefined)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => {
                if (!sessionCourse) {
                  return;
                }

                const seatsTotal = Number(sessionSeats);
                updateCourse(sessionCourse.id, {
                  ...sessionCourse,
                  nextSession: sessionDate,
                  seatsTotal,
                  status: getCourseStatusAfterCapacity(sessionCourse, {
                    seatsTotal,
                    status: sessionStatus,
                  }),
                });
                setSessionCourse(undefined);
                showToast("Session created");
              }}
            >
              Save session
            </button>
          </div>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass}>Session date</span>
            <input
              type="date"
              value={sessionDate}
              onChange={(event) => setSessionDate(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Seats available</span>
            <input
              type="number"
              value={sessionSeats}
              onChange={(event) => setSessionSeats(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="grid gap-2 md:col-span-2">
            <span className={labelClass}>Status</span>
            <select
              value={sessionStatus}
              onChange={(event) => setSessionStatus(event.target.value as CourseStatus)}
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
        </div>
      </Modal>

      <Modal
        open={Boolean(delegatesCourse)}
        onClose={() => setDelegatesCourse(undefined)}
        title={delegatesCourse ? `Manage delegates: ${delegatesCourse.name}` : "Manage delegates"}
        description="Review assigned delegates and create a new booking for this course."
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setDelegatesCourse(undefined)}
            >
              Close
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => {
                if (!delegatesCourse || !selectedDelegate) {
                  showToast("Select a delegate");
                  return;
                }

                if (delegatesCourse.seatsFilled >= delegatesCourse.seatsTotal) {
                  showToast("Course is already full");
                  return;
                }

                addBooking({
                  delegateName: selectedDelegate,
                  courseName: delegatesCourse.name,
                  type: bookingType,
                  date: bookingDate,
                });
                updateCourse(delegatesCourse.id, {
                  ...delegatesCourse,
                  seatsFilled: Math.min(
                    delegatesCourse.seatsTotal,
                    delegatesCourse.seatsFilled + 1,
                  ),
                  status: getCourseStatusAfterCapacity(delegatesCourse, {
                    seatsFilled: Math.min(
                      delegatesCourse.seatsTotal,
                      delegatesCourse.seatsFilled + 1,
                    ),
                  }),
                });
                setDelegatesCourse(undefined);
                showToast("Delegate booking created");
              }}
            >
              Add booking
            </button>
          </div>
        }
      >
        {delegatesCourse ? (
          <div className="space-y-5">
            <div className="space-y-3">
              {state.delegates.filter(
                (delegate) => delegate.courseName === delegatesCourse.name,
              ).length > 0 ? (
                state.delegates
                  .filter((delegate) => delegate.courseName === delegatesCourse.name)
                  .map((delegate) => (
                    <div
                      key={delegate.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200/80 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-950">{delegate.name}</p>
                        <p className="text-sm text-slate-600">{delegate.company}</p>
                      </div>
                      <StatusPill
                        label={delegate.progress}
                        tone={delegate.progress === "Completed" ? "positive" : "neutral"}
                      />
                    </div>
                  ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                  No delegates are currently linked to this course.
                </div>
              )}
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className={labelClass}>Delegate</span>
                <select
                  value={selectedDelegate}
                  onChange={(event) => setSelectedDelegate(event.target.value)}
                  className={fieldClass}
                >
                  {state.delegates.map((delegate) => (
                    <option key={delegate.id} value={delegate.name}>
                      {delegate.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className={labelClass}>Delivery type</span>
                <select
                  value={bookingType}
                  onChange={(event) =>
                    setBookingType(event.target.value as "Virtual" | "In-person")
                  }
                  className={fieldClass}
                >
                  <option value="Virtual">Virtual</option>
                  <option value="In-person">In-person</option>
                </select>
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className={labelClass}>Booking date</span>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(event) => setBookingDate(event.target.value)}
                  className={fieldClass}
                />
              </label>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(commentCourse)}
        onClose={() => setCommentCourse(undefined)}
        title={commentCourse ? `Comment on ${commentCourse.name}` : "Comment"}
        description="Add review context before publication approval."
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setCommentCourse(undefined)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => {
                if (!commentCourse) {
                  return;
                }

                setPublishingQueue((current) =>
                  current.map((entry) =>
                    entry.courseId === commentCourse.id
                      ? { ...entry, note: queueComment || entry.note }
                      : entry,
                  ),
                );
                setCommentCourse(undefined);
                showToast("Queue comment saved");
              }}
            >
              Save comment
            </button>
          </div>
        }
      >
        <label className="grid gap-2">
          <span className={labelClass}>Comment</span>
          <textarea
            rows={4}
            value={queueComment}
            onChange={(event) => setQueueComment(event.target.value)}
            className={fieldClass}
          />
        </label>
      </Modal>
    </DashboardShell>
  );
}
