"use client";

import Link from "next/link";
import { panelClass } from "@/components/app/ui";
import { useSystem } from "@/components/app/SystemProvider";
import { isWithinDays } from "@/components/app/utils";
import { AppIcon, type IconName } from "@/components/dashboard/icons";

type SidebarProps = {
  currentPath: string;
};

const navItems: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/courses", label: "Courses", icon: "school" },
  { href: "/bookings", label: "Bookings", icon: "event_available" },
  { href: "/delegates", label: "Delegates", icon: "groups" },
  { href: "/reports", label: "Reports", icon: "analytics" },
  { href: "/users", label: "Users", icon: "person_outline" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export default function Sidebar({ currentPath }: SidebarProps) {
  const { state } = useSystem();
  const expiringCount = state.delegates.filter((delegate) =>
    isWithinDays(delegate.expiry, 14),
  ).length;

  return (
    <aside className="border-b border-slate-200/80 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col px-5 py-6">
        <div className="border-b border-slate-200/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4f6d78] shadow-[0_1px_2px_rgba(11,60,145,0.12),0_8px_18px_rgba(11,60,145,0.16)]">
              <AllnetLogo className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                ALLNET Law
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-slate-950">
                Compliance Platform
              </h1>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Internal tools for training delivery, compliance tracking, and
            audit readiness.
          </p>
        </div>

        <div className="mt-6">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Navigation
          </p>

          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={currentPath === item.href}
              />
            ))}
          </nav>
        </div>

        <div className={`mt-8 bg-slate-50/90 p-5 lg:mt-auto ${panelClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Compliance Health
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {state.summary.mandatoryTrainingCompletion.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg bg-[var(--primary-soft)] p-2 text-[var(--primary)]">
              <AppIcon name="check_circle" className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Audit packs ready</span>
              <span className="font-medium text-slate-950">
                {state.summary.auditPacksReady}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Expiring certificates</span>
              <span className="font-medium text-slate-950">{expiringCount}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AllnetLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 130 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="130" height="130" rx="0" fill="#506F7A" />
      <path
        d="M60 6 109 124H91L47 23 60 6Z"
        fill="#19E0C3"
      />
      <path
        d="M26 88c0-11 8.8-19.9 19.7-19.9 11.8 0 21.5 8.8 21.5 20.6C67.2 101.6 57 112 42.9 112 31.7 112 26 101.6 26 88Z"
        fill="#19E0C3"
      />
    </svg>
  );
}

type NavItemProps = {
  href: string;
  label: string;
  icon: IconName;
  active?: boolean;
};

function NavItem({ href, label, icon, active = false }: NavItemProps) {
  return (
    <Link
      href={href}
      data-interactive="true"
      className={`group flex items-center gap-3 rounded-[var(--radius-sm)] border px-3.5 py-3 text-sm font-medium ${
        active
          ? "border-[#dbe7ff] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)]"
          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <AppIcon
        name={icon}
        className={`h-4 w-4 transition-transform duration-150 ${active ? "" : "group-hover:scale-105"}`}
      />
      <span>{label}</span>
    </Link>
  );
}
