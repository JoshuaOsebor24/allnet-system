"use client";

import { useRouter } from "next/navigation";
import StatusPill from "@/components/dashboard/StatusPill";

type BookingRowProps = {
  initials: string;
  initialsBg: string;
  initialsText: string;
  name: string;
  course: string;
  date: string;
  status: string;
  statusType: "completed" | "pending";
  href: string;
};

export default function BookingRow({
  initials,
  initialsBg,
  initialsText,
  name,
  course,
  date,
  status,
  statusType,
  href,
}: BookingRowProps) {
  const router = useRouter();

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
      className="cursor-pointer transition-all duration-200 ease-in-out hover:bg-slate-50/80"
    >
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${initialsBg} ${initialsText}`}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">{name}</p>
            <p className="text-xs text-slate-500">Delegate record</p>
          </div>
        </div>
      </td>

      <td className="px-6 py-5 text-sm font-medium text-slate-700">{course}</td>
      <td className="px-6 py-5 text-sm text-slate-600">{date}</td>
      <td className="px-6 py-5">
        <StatusPill
          label={status}
          tone={statusType === "completed" ? "positive" : "warning"}
        />
      </td>
    </tr>
  );
}
