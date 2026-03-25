"use client";

import { useMemo, useState } from "react";
import EmptyState from "@/components/app/EmptyState";
import BookingFormModal from "@/components/app/BookingFormModal";
import Modal from "@/components/app/Modal";
import { useSystem, type Booking } from "@/components/app/SystemProvider";
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
import PageHeader from "@/components/dashboard/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import StatusPill from "@/components/dashboard/StatusPill";

const bookingColumns: DataTableColumn[] = [
  { key: "delegate", label: "Delegate" },
  { key: "course", label: "Course" },
  { key: "trainer", label: "Trainer" },
  { key: "type", label: "Type" },
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "urgency", label: "Priority" },
  { key: "actions", label: "Actions", align: "right" },
];

type BookingUrgency = "urgent" | "attention" | "track";
function getBookingUrgency(booking: Booking): BookingUrgency {
  if (
    booking.status === "Pending" &&
    booking.date <= "2026-03-26"
  ) {
    return "urgent";
  }

  if (
    booking.status === "Pending" ||
    booking.trainer === "Unassigned" ||
    booking.status === "Cancelled"
  ) {
    return "attention";
  }

  return "track";
}

function getUrgencyBadge(urgency: BookingUrgency) {
  switch (urgency) {
    case "urgent":
      return { label: "Urgent", tone: "danger" as const };
    case "attention":
      return { label: "Needs attention", tone: "warning" as const };
    default:
      return { label: "On track", tone: "positive" as const };
  }
}

function getStatusTone(status: Booking["status"]) {
  switch (status) {
    case "Completed":
      return "positive" as const;
    case "Confirmed":
      return "positive" as const;
    case "Cancelled":
      return "danger" as const;
    default:
      return "warning" as const;
  }
}

function getRowClassName(booking: Booking) {
  const urgency = getBookingUrgency(booking);

  if (urgency === "urgent") {
    return "bg-rose-50/35 hover:!bg-rose-50/60";
  }

  if (booking.status === "Pending") {
    return "bg-amber-50/25 hover:!bg-amber-50/55";
  }

  if (booking.status === "Confirmed") {
    return "bg-emerald-50/25 hover:!bg-emerald-50/55";
  }

  return "";
}

export default function BookingsPage() {
  const {
    state,
    addBooking,
    exportFile,
    showToast,
    updateBooking,
  } = useSystem();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All bookings");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsBooking, setDetailsBooking] = useState<Booking | undefined>();
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | undefined>();
  const [assignTrainerBooking, setAssignTrainerBooking] = useState<Booking | undefined>();
  const [trainerFilter, setTrainerFilter] = useState("All trainers");
  const [courseFilter, setCourseFilter] = useState("All courses");
  const [rescheduleDate, setRescheduleDate] = useState("2026-03-26");
  const [trainerName, setTrainerName] = useState("");
  const [menuBookingId, setMenuBookingId] = useState<string | null>(null);

  const trainerOptions = Array.from(
    new Set(
      state.bookings.map((booking) => booking.trainer || "Unassigned"),
    ),
  );
  const courseOptions = Array.from(new Set(state.bookings.map((booking) => booking.courseName)));

  const bookingsWithUrgency = useMemo(
    () =>
      [...state.bookings]
        .map((booking) => ({ booking, urgency: getBookingUrgency(booking) }))
        .sort((left, right) => {
          const urgencyOrder = { urgent: 0, attention: 1, track: 2 };
          const urgencyDiff =
            urgencyOrder[left.urgency] - urgencyOrder[right.urgency];

          if (urgencyDiff !== 0) {
            return urgencyDiff;
          }

          return left.booking.date.localeCompare(right.booking.date);
        }),
    [state.bookings],
  );

  const urgentBookings = bookingsWithUrgency
    .filter((entry) => entry.urgency === "urgent")
    .map((entry) => entry.booking);

  const attentionBookings = bookingsWithUrgency
    .filter((entry) => entry.urgency !== "track")
    .map((entry) => entry.booking)
    .slice(0, 3);

  const filteredBookings = bookingsWithUrgency
    .filter(({ booking, urgency }) => {
      const matchesSearch = matchesQuery(
        [
          booking.delegateName,
          booking.courseName,
          booking.type,
          booking.status,
          booking.trainer,
        ],
        search,
      );

      if (!matchesSearch) {
        return false;
      }

      if (trainerFilter !== "All trainers" && booking.trainer !== trainerFilter) {
        return false;
      }

      if (courseFilter !== "All courses" && booking.courseName !== courseFilter) {
        return false;
      }

      switch (activeFilter) {
        case "Today":
          return booking.date === "2026-03-25";
        case "This week":
          return booking.date >= "2026-03-25" && booking.date <= "2026-03-31";
        case "Urgent":
          return urgency === "urgent";
        case "Pending":
          return booking.status === "Pending";
        case "Confirmed":
          return booking.status === "Confirmed";
        case "Completed":
          return booking.status === "Completed";
        default:
          return !urgentBookings.some((item) => item.id === booking.id);
      }
    })
    .map((entry) => entry.booking);

  const pendingBookings = state.bookings.filter(
    (booking) => booking.status === "Pending",
  ).length;
  const confirmedBookings = state.bookings.filter(
    (booking) => booking.status === "Confirmed",
  ).length;
  const completedBookings = state.bookings.filter(
    (booking) => booking.status === "Completed",
  ).length;

  function handleConfirm(booking: Booking) {
    updateBooking(booking.id, { status: "Confirmed" });
  }

  function handleComplete(booking: Booking) {
    updateBooking(booking.id, { status: "Completed" });
  }

  function handleCancel(booking: Booking) {
    updateBooking(booking.id, { status: "Cancelled" });
  }

  function handleAssignTrainer(booking: Booking, trainer: string) {
    updateBooking(booking.id, { trainer, status: booking.status });
    showToast(`Trainer assigned to ${booking.delegateName}`);
  }

  const rows: DataTableRow[] = filteredBookings.map((booking) => {
    const urgency = getBookingUrgency(booking);
    const urgencyBadge = getUrgencyBadge(urgency);

    return {
      id: booking.id,
      onClick: () => setDetailsBooking(booking),
      rowClassName: getRowClassName(booking),
      cells: {
        delegate: (
          <div>
            <p className="font-semibold text-slate-950">{booking.delegateName}</p>
            <p className="text-xs text-slate-500">
              {booking.status} booking
            </p>
          </div>
        ),
        course: (
          <div>
            <p className="font-medium text-slate-800">{booking.courseName}</p>
            <p className="text-xs text-slate-500">{booking.type} delivery</p>
          </div>
        ),
        trainer: (
          <span
            className={
              booking.trainer === "Unassigned"
                ? "font-medium text-amber-700"
                : "text-slate-700"
            }
          >
            {booking.trainer ?? "Unassigned"}
          </span>
        ),
        type: booking.type,
        date: formatDisplayDate(booking.date),
        status: (
          <StatusPill label={booking.status} tone={getStatusTone(booking.status)} />
        ),
        urgency: (
          <StatusPill label={urgencyBadge.label} tone={urgencyBadge.tone} />
        ),
        actions: (
          <div
            className="flex flex-wrap items-center justify-end gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            {booking.status === "Pending" ? (
              <button
                type="button"
                className={`${primaryButtonClass} px-3.5 py-2 text-xs`}
                onClick={() => handleConfirm(booking)}
              >
                Confirm booking
              </button>
            ) : null}
            <button
              type="button"
              className={`${secondaryButtonClass} px-3.5 py-2 text-xs`}
              onClick={() => {
                setAssignTrainerBooking(booking);
                setTrainerName(
                  booking.trainer && booking.trainer !== "Unassigned"
                    ? booking.trainer
                    : "",
                );
              }}
            >
              Assign trainer
            </button>
            <div className="relative">
              <button
                type="button"
                className={`${ghostButtonClass} px-3.5 py-2 text-xs`}
                onClick={() =>
                  setMenuBookingId((current) =>
                    current === booking.id ? null : booking.id,
                  )
                }
              >
                More
              </button>
              {menuBookingId === booking.id ? (
                <div className="absolute right-0 z-20 mt-2 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_28px_rgba(15,23,42,0.14)]">
                  <button
                    type="button"
                    className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50"
                    onClick={() => {
                      setMenuBookingId(null);
                      setDetailsBooking(booking);
                    }}
                  >
                    View details
                  </button>
                  <button
                    type="button"
                    className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50"
                    onClick={() => {
                      setMenuBookingId(null);
                      setRescheduleBooking(booking);
                      setRescheduleDate(toDateInputValue(booking.date));
                    }}
                  >
                    Reschedule
                  </button>
                  {booking.status === "Confirmed" ? (
                    <button
                      type="button"
                      className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50"
                      onClick={() => {
                        setMenuBookingId(null);
                        handleComplete(booking);
                      }}
                    >
                      Mark completed
                    </button>
                  ) : null}
                  {booking.status !== "Cancelled" ? (
                    <button
                      type="button"
                      className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-rose-700 transition-all duration-200 ease-in-out hover:bg-rose-50"
                      onClick={() => {
                        setMenuBookingId(null);
                        handleCancel(booking);
                      }}
                    >
                      Cancel booking
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ),
      },
    };
  });

  return (
    <DashboardShell currentPath="/bookings">
      <PageHeader
        title="Bookings"
        description="Manage booking confirmations, trainer assignment, rescheduling, and delegate delivery readiness."
        actions={[
          {
            label: "Export report",
            variant: "secondary",
            onClick: () =>
              exportFile(
                "bookings.csv",
                toCsv([
                  ["Delegate", "Course", "Trainer", "Type", "Date", "Status"],
                  ...bookingsWithUrgency.map(({ booking }) => [
                    booking.delegateName,
                    booking.courseName,
                    booking.trainer ?? "Unassigned",
                    booking.type,
                    formatDisplayDate(booking.date),
                    booking.status,
                  ]),
                ]),
                "text/csv;charset=utf-8",
              ),
          },
          {
            label: "Create booking",
            onClick: () => setModalOpen(true),
          },
        ]}
      />

      <div className="mt-8">
        <FilterBar
          searchPlaceholder="Search delegates, courses, or trainers"
          filters={[
            "All bookings",
            "Today",
            "This week",
            "Urgent",
            "Pending",
            "Confirmed",
            "Completed",
          ]}
          searchValue={search}
          activeFilter={activeFilter}
          onSearchChange={setSearch}
          onFilterChange={setActiveFilter}
          insightLabel="Action required"
          insightMessage={`${urgentBookings.length} urgent bookings need immediate action. ${pendingBookings} bookings still require operational follow-up.`}
        />
      </div>

      <section className={`${panelClass} mt-6 px-6 py-5`}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),220px,220px]">
          <label className="grid gap-2">
            <span className={labelClass}>Search and filters</span>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
              Refine by course and trainer to narrow the operational queue.
            </div>
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Filter by course</span>
            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              className={`${fieldClass} h-12`}
            >
              <option value="All courses">All courses</option>
              {courseOptions.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Filter by trainer</span>
            <select
              value={trainerFilter}
              onChange={(event) => setTrainerFilter(event.target.value)}
              className={`${fieldClass} h-12`}
            >
              <option value="All trainers">All trainers</option>
              {trainerOptions.map((trainer) => (
                <option key={trainer} value={trainer}>
                  {trainer}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="flag"
          title="Urgent Bookings"
          value={String(urgentBookings.length)}
          trend={`${pendingBookings} pending`}
          context="Within 24h"
          statusLabel={urgentBookings.length > 0 ? "Critical" : "Healthy"}
          statusTone={urgentBookings.length > 0 ? "critical" : "healthy"}
          positive={urgentBookings.length === 0}
        />
        <StatCard
          icon="confirmation_number"
          title="Total Bookings"
          value={String(state.bookings.length)}
          trend="+4 this week"
          context="Active programmes"
          statusLabel="Healthy"
          statusTone="healthy"
        />
        <StatCard
          icon="event_available"
          title="Confirmed Sessions"
          value={String(confirmedBookings)}
          trend={`${completedBookings} completed`}
          context="Ready for delivery"
          statusLabel="On track"
          statusTone="healthy"
        />
        <StatCard
          icon="calendar"
          title="Needs Attention"
          value={String(attentionBookings.length)}
          trend={`${state.bookings.filter((booking) => booking.trainer === "Unassigned").length} unassigned`}
          context="Needs follow-up"
          statusLabel={attentionBookings.length > 0 ? "Warning" : "Healthy"}
          statusTone={attentionBookings.length > 0 ? "warning" : "healthy"}
          positive={attentionBookings.length === 0}
        />
      </div>

      <section className={`${panelClass} mt-8`}>
        <div className="border-b border-slate-200/80 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-950">
            Attention Required
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            Bookings surfaced in priority order for quick operational decisions.
          </p>
        </div>

        <div className="divide-y divide-slate-200/80">
          {attentionBookings.length > 0 ? (
            attentionBookings.map((booking) => {
              const urgency = getUrgencyBadge(getBookingUrgency(booking));

              return (
                <div
                  key={booking.id}
                  className="px-6 py-5 transition-all duration-200 ease-in-out hover:bg-slate-50/70"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-sm font-semibold text-slate-950">
                          {booking.delegateName}
                        </h3>
                        <StatusPill label={urgency.label} tone={urgency.tone} />
                        <StatusPill
                          label={booking.status}
                          tone={getStatusTone(booking.status)}
                        />
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-slate-600">
                        {booking.courseName} · {formatDisplayDate(booking.date)} ·{" "}
                        {booking.trainer ?? "Unassigned"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {booking.status === "Pending" ? (
                        <button
                          type="button"
                          className={primaryButtonClass}
                          onClick={() => handleConfirm(booking)}
                        >
                          Confirm
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => {
                          setAssignTrainerBooking(booking);
                          setTrainerName(
                            booking.trainer && booking.trainer !== "Unassigned"
                              ? booking.trainer
                              : "",
                          );
                        }}
                      >
                        Assign trainer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-5 text-sm text-slate-500">
              No bookings currently need attention.
            </div>
          )}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr),340px]">
        <DataTableCard
          title="Bookings"
          description="Operational booking view with trainer ownership, priority, and workflow actions."
          columns={bookingColumns}
          rows={rows}
          actions={
            <button
              type="button"
              className={ghostButtonClass}
              onClick={() => {
                setSearch("");
                setActiveFilter("All bookings");
                setTrainerFilter("All trainers");
                setCourseFilter("All courses");
              }}
            >
              Reset view
            </button>
          }
        />

        <aside className={`${panelClass} border-slate-200/70 bg-slate-50/35`}>
          <div className="border-b border-slate-200/80 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-950">
              Action queue
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              Urgent bookings only, with direct follow-up actions.
            </p>
          </div>

          <div className="divide-y divide-slate-200/80">
            {urgentBookings.length > 0 ? (
              urgentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-rose-50/35 px-6 py-5 transition-all duration-200 ease-in-out hover:bg-rose-50/55"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium text-slate-950">
                      {booking.delegateName}
                    </h3>
                    <StatusPill label="Urgent" tone="danger" />
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    {booking.courseName} · {formatDisplayDate(booking.date)} ·{" "}
                    {booking.trainer ?? "Unassigned"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={primaryButtonClass}
                      onClick={() => handleConfirm(booking)}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={() => {
                        setAssignTrainerBooking(booking);
                        setTrainerName(
                          booking.trainer && booking.trainer !== "Unassigned"
                            ? booking.trainer
                            : "",
                        );
                      }}
                    >
                      Assign trainer
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-6">
                <EmptyState
                  title="No urgent bookings"
                  description="The urgent action queue is clear. New at-risk bookings will appear here automatically."
                  icon="check_circle"
                />
              </div>
            )}
          </div>
        </aside>
      </div>

      <BookingFormModal
        key={modalOpen ? "bookings-open" : "bookings-closed"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create booking"
        delegates={state.delegates}
        courses={state.courses}
        onSubmit={(input) => addBooking(input)}
      />

      <Modal
        open={Boolean(detailsBooking)}
        onClose={() => setDetailsBooking(undefined)}
        title={detailsBooking ? `Booking: ${detailsBooking.delegateName}` : "Booking details"}
        description="Operational booking summary and next actions."
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setDetailsBooking(undefined)}
            >
              Close
            </button>
            {detailsBooking?.status === "Pending" ? (
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => {
                  if (!detailsBooking) {
                    return;
                  }

                  handleConfirm(detailsBooking);
                  setDetailsBooking(undefined);
                }}
              >
                Confirm booking
              </button>
            ) : null}
          </div>
        }
      >
        {detailsBooking ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <p className={labelClass}>Delegate</p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {detailsBooking.delegateName}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <p className={labelClass}>Course</p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {detailsBooking.courseName}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <p className={labelClass}>Trainer</p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {detailsBooking.trainer ?? "Unassigned"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <p className={labelClass}>Delivery date</p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {formatDisplayDate(detailsBooking.date)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <p className={labelClass}>Status</p>
              <div className="mt-2">
                <StatusPill
                  label={detailsBooking.status}
                  tone={getStatusTone(detailsBooking.status)}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
              <p className={labelClass}>Priority</p>
              <div className="mt-2">
                <StatusPill
                  label={getUrgencyBadge(getBookingUrgency(detailsBooking)).label}
                  tone={getUrgencyBadge(getBookingUrgency(detailsBooking)).tone}
                />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(rescheduleBooking)}
        onClose={() => setRescheduleBooking(undefined)}
        title={
          rescheduleBooking
            ? `Reschedule: ${rescheduleBooking.delegateName}`
            : "Reschedule booking"
        }
        description="Update the delivery date for this booking."
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setRescheduleBooking(undefined)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => {
                if (!rescheduleBooking) {
                  return;
                }

                updateBooking(rescheduleBooking.id, { date: rescheduleDate });
                setRescheduleBooking(undefined);
              }}
            >
              Save date
            </button>
          </div>
        }
      >
        <label className="grid gap-2">
          <span className={labelClass}>New date</span>
          <input
            type="date"
            value={rescheduleDate}
            onChange={(event) => setRescheduleDate(event.target.value)}
            className={fieldClass}
          />
        </label>
      </Modal>

      <Modal
        open={Boolean(assignTrainerBooking)}
        onClose={() => setAssignTrainerBooking(undefined)}
        title={
          assignTrainerBooking
            ? `Assign trainer: ${assignTrainerBooking.delegateName}`
            : "Assign trainer"
        }
        description="Set trainer ownership for this booking."
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setAssignTrainerBooking(undefined)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => {
                if (!assignTrainerBooking || trainerName.trim().length === 0) {
                  showToast("Enter a trainer name");
                  return;
                }

                handleAssignTrainer(assignTrainerBooking, trainerName.trim());
                setAssignTrainerBooking(undefined);
              }}
            >
              Save trainer
            </button>
          </div>
        }
      >
        <label className="grid gap-2">
          <span className={labelClass}>Trainer</span>
          <input
            value={trainerName}
            onChange={(event) => setTrainerName(event.target.value)}
            className={fieldClass}
            placeholder="Enter trainer name"
          />
        </label>
      </Modal>
    </DashboardShell>
  );
}
