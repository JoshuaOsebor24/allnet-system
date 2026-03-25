import type { ReactNode } from "react";
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
