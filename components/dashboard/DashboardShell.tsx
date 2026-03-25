"use client";

import type { ReactNode } from "react";
import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AUTH_STORAGE_KEY } from "@/components/app/auth";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

type DashboardShellProps = {
  currentPath: string;
  children: ReactNode;
};

export default function DashboardShell({
  currentPath,
  children,
}: DashboardShellProps) {
  const router = useRouter();
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

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <Sidebar currentPath={currentPath} />

      <main className="min-h-screen lg:ml-72">
        <Topbar />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
