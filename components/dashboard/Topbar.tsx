"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Modal from "@/components/app/Modal";
import { useSystem } from "@/components/app/SystemProvider";
import {
  iconButtonClass,
  panelClass,
  secondaryButtonClass,
} from "@/components/app/ui";
import { formatDisplayDate, isWithinDays, matchesQuery } from "@/components/app/utils";
import { AppIcon } from "@/components/dashboard/icons";

export default function Topbar() {
  const { state, resetData } = useSystem();
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const currentUser =
    state.users.find((user) => user.name === "Alex Chen") ?? state.users[0];

  const bookingMatches = state.bookings
    .filter((booking) =>
      matchesQuery(
        [booking.delegateName, booking.courseName, booking.type, booking.status],
        query,
      ),
    )
    .slice(0, 3);
  const courseMatches = state.courses
    .filter((course) =>
      matchesQuery([course.name, course.code, course.owner, course.category], query),
    )
    .slice(0, 3);
  const delegateMatches = state.delegates
    .filter((delegate) =>
      matchesQuery(
        [delegate.name, delegate.company, delegate.recordId, delegate.courseName],
        query,
      ),
    )
    .slice(0, 3);
  const userMatches = state.users
    .filter((user) =>
      matchesQuery([user.name, user.email, user.role, user.team], query),
    )
    .slice(0, 3);

  const pendingBookings = state.bookings.filter(
    (booking) => booking.status === "Pending",
  ).length;
  const expiringCount = state.delegates.filter((delegate) =>
    isWithinDays(delegate.expiry, 14),
  ).length;
  const pendingMfa = state.users.filter(
    (user) => user.status === "Pending MFA",
  ).length;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="hidden items-center gap-3 lg:flex">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              ALLNET Law
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-sm text-slate-600">
              Internal compliance system
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative block w-full sm:w-80">
              <label className="relative block">
                <AppIcon
                  name="search"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  aria-label="Search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search records, bookings, or users"
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3.5 text-sm text-slate-700 outline-none transition-all duration-150 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
                />
              </label>

              {query ? (
                <div
                  className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.16)] ${panelClass}`}
                >
                  <SearchSection
                    title="Bookings"
                    href="/bookings"
                    items={bookingMatches.map((booking) => ({
                      label: booking.delegateName,
                      helper: `${booking.courseName} · ${formatDisplayDate(booking.date)}`,
                    }))}
                  />
                  <SearchSection
                    title="Courses"
                    href="/courses"
                    items={courseMatches.map((course) => ({
                      label: course.name,
                      helper: `${course.code} · ${course.owner}`,
                    }))}
                  />
                  <SearchSection
                    title="Delegates"
                    href="/delegates"
                    items={delegateMatches.map((delegate) => ({
                      label: delegate.name,
                      helper: `${delegate.recordId} · ${delegate.company}`,
                    }))}
                  />
                  <SearchSection
                    title="Users"
                    href="/users"
                    items={userMatches.map((user) => ({
                      label: user.name,
                      helper: `${user.role} · ${user.email}`,
                    }))}
                  />
                </div>
              ) : null}
            </div>

            <div className="relative flex items-center gap-2">
              <button
                type="button"
                aria-label="Notifications"
                title="Notifications"
                onClick={() => {
                  setNotificationsOpen((current) => !current);
                  setProfileOpen(false);
                }}
                className={`relative ${iconButtonClass}`}
              >
                <AppIcon name="notifications" className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              </button>

              <button
                type="button"
                aria-label="Help"
                title="Help"
                onClick={() => setHelpOpen(true)}
                className={iconButtonClass}
              >
                <AppIcon name="help_outline" className="h-5 w-5" />
              </button>

              <button
                type="button"
                title="Open profile menu"
                onClick={() => {
                  setProfileOpen((current) => !current);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-slate-300 bg-white px-2.5 py-2 text-left shadow-[var(--shadow-sm)] transition-all duration-150 hover:border-slate-400 hover:bg-slate-50 hover:shadow-[var(--shadow-md)]"
              >
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjOYlwYZOM2TGBIil7Bb7AURsNSkT7JnfJM9fgszE6XMDJOHaztW2M51l-sc4u2m9aq0FN96ae0KbfezdJdxgxcpXdZKT2nPwJ6Krw5JbXfLJdtaG_0iU7kxQn57ChwVQTRQhA6zzz2B2xsAuebn1apNjQ-sbr7-WlQWqoM287HBLe1VdA9qheC3V6pCUDB6M2pTg9xSHo4EqUd__yQigaAnxqSza0weKJoa2vTNBqqn-xAeqjQu1yPM94G3ubigS1ebzfWy06jiE"
                  alt={currentUser?.name ?? "Current user"}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                />
                <div className="hidden pr-1 sm:block">
                  <p className="text-sm font-medium text-slate-950">
                    {currentUser?.name ?? "Current user"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {currentUser?.role ?? "Admin"}
                  </p>
                </div>
              </button>

              {notificationsOpen ? (
                <div
                  className={`absolute right-0 top-[calc(100%+0.5rem)] z-30 w-80 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.16)] ${panelClass}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Notifications
                  </p>
                  <div className="mt-3 space-y-3 text-sm">
                    <NotificationRow
                      title={`${pendingBookings} bookings pending confirmation`}
                      helper="Operations follow-up required before trainer allocation."
                    />
                    <NotificationRow
                      title={`${expiringCount} certifications expiring within 14 days`}
                      helper="Delegate outreach and renewal scheduling are still open."
                    />
                    <NotificationRow
                      title={`${pendingMfa} users pending MFA`}
                      helper="Access reviews and sign-in protection need attention."
                    />
                  </div>
                </div>
              ) : null}

              {profileOpen ? (
                <div
                  className={`absolute right-0 top-[calc(100%+0.5rem)] z-30 w-72 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.16)] ${panelClass}`}
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {currentUser?.name ?? "Current user"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Current session controls
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetData();
                        setProfileOpen(false);
                      }}
                      className={secondaryButtonClass}
                    >
                      Reset session data
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileOpen(false)}
                      className={secondaryButtonClass}
                    >
                      Close menu
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="System help"
        description="Quick guidance for the internal compliance platform."
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className={secondaryButtonClass}
            >
              Close
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-sm leading-6 text-slate-600">
          <p>Use the top search to jump to matching bookings, courses, delegates, or users.</p>
          <p>Page actions create records, update statuses, export files, or open change dialogs.</p>
          <p>Session data is preserved while the browser tab remains active, and you can reset it from the profile menu.</p>
        </div>
      </Modal>
    </>
  );
}

type SearchSectionProps = {
  title: string;
  href: string;
  items: Array<{ label: string; helper: string }>;
};

function SearchSection({ title, href, items }: SearchSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 first:mt-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {title}
        </p>
        <Link href={href} className="text-xs font-medium text-[var(--primary)]">
          Open
        </Link>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={`${title}-${item.label}-${item.helper}`}
            className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5"
          >
            <p className="text-sm font-medium text-slate-950">{item.label}</p>
            <p className="text-xs text-slate-500">{item.helper}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationRow({
  title,
  helper,
}: {
  title: string;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
      <p className="font-medium text-slate-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  );
}
