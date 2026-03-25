import type { SVGProps } from "react";

export type IconName =
  | "add"
  | "analytics"
  | "arrow_up_right"
  | "auto_stories"
  | "badge"
  | "calendar"
  | "check_circle"
  | "chevron_right"
  | "clock"
  | "confirmation_number"
  | "dashboard"
  | "download"
  | "event_available"
  | "file_chart"
  | "filter"
  | "flag"
  | "groups"
  | "help_outline"
  | "history_edu"
  | "more_horiz"
  | "notifications"
  | "payments"
  | "person_outline"
  | "school"
  | "search"
  | "settings"
  | "shield"
  | "spark"
  | "task_alt"
  | "trending_down"
  | "trending_up";

type AppIconProps = {
  name: IconName;
} & SVGProps<SVGSVGElement>;

export function AppIcon({ name, ...props }: AppIconProps) {
  const baseProps = {
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
    ...props,
  };

  switch (name) {
    case "add":
      return (
        <svg {...baseProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...baseProps}>
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M22 20v-4" />
        </svg>
      );
    case "arrow_up_right":
      return (
        <svg {...baseProps}>
          <path d="M7 17 17 7" />
          <path d="M9 7h8v8" />
        </svg>
      );
    case "auto_stories":
      return (
        <svg {...baseProps}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h5" />
        </svg>
      );
    case "badge":
      return (
        <svg {...baseProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M12 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4" />
          <path d="M8 17a4 4 0 0 1 8 0" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...baseProps}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 10h16" />
        </svg>
      );
    case "check_circle":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12 2.5 2.5 4.5-5" />
        </svg>
      );
    case "chevron_right":
      return (
        <svg {...baseProps}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case "clock":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "confirmation_number":
      return (
        <svg {...baseProps}>
          <path d="M4 9V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5V9a2 2 0 0 0 0 6v2.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5V15a2 2 0 0 0 0-6Z" />
          <path d="M12 8v8" />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...baseProps}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="5" rx="1.5" />
          <rect x="13" y="11" width="7" height="9" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "download":
      return (
        <svg {...baseProps}>
          <path d="M12 4v11" />
          <path d="m8 11 4 4 4-4" />
          <path d="M5 20h14" />
        </svg>
      );
    case "event_available":
      return (
        <svg {...baseProps}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 10h16" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
    case "file_chart":
      return (
        <svg {...baseProps}>
          <path d="M7 3h7l5 5v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M14 3v5h5" />
          <path d="M9 17v-3" />
          <path d="M12 17v-5" />
          <path d="M15 17v-2" />
        </svg>
      );
    case "filter":
      return (
        <svg {...baseProps}>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
      );
    case "flag":
      return (
        <svg {...baseProps}>
          <path d="M5 21V4" />
          <path d="M5 5h10l-2 4 2 4H5" />
        </svg>
      );
    case "groups":
      return (
        <svg {...baseProps}>
          <path d="M9 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
          <path d="M17 12a2.5 2.5 0 1 0 0-5" />
          <path d="M4.5 19a4.5 4.5 0 0 1 9 0" />
          <path d="M14 19a3.5 3.5 0 0 1 6 0" />
        </svg>
      );
    case "help_outline":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-.9.8-1.7 1.3-1.7 2.7" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "history_edu":
      return (
        <svg {...baseProps}>
          <path d="M7 4h8l4 4v12H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
          <path d="M15 4v4h4" />
          <path d="m9 15 5-5 2 2-5 5-3 1z" />
        </svg>
      );
    case "more_horiz":
      return (
        <svg {...baseProps}>
          <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "notifications":
      return (
        <svg {...baseProps}>
          <path d="M15 17H9a3 3 0 0 1-3-3v-3a6 6 0 1 1 12 0v3a3 3 0 0 1-3 3Z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      );
    case "payments":
      return (
        <svg {...baseProps}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h3" />
        </svg>
      );
    case "person_outline":
      return (
        <svg {...baseProps}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "school":
      return (
        <svg {...baseProps}>
          <path d="m3 9 9-5 9 5-9 5Z" />
          <path d="M7 11v4.5a7.5 7.5 0 0 0 10 0V11" />
          <path d="M21 10v6" />
        </svg>
      );
    case "search":
      return (
        <svg {...baseProps}>
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-4.2-4.2" />
        </svg>
      );
    case "settings":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3" />
          <path d="M12 19v3" />
          <path d="m4.9 4.9 2.1 2.1" />
          <path d="m17 17 2.1 2.1" />
          <path d="M2 12h3" />
          <path d="M19 12h3" />
          <path d="m4.9 19.1 2.1-2.1" />
          <path d="M17 7l2.1-2.1" />
        </svg>
      );
    case "shield":
      return (
        <svg {...baseProps}>
          <path d="M12 3 5 6v5c0 4.5 2.8 8.4 7 10 4.2-1.6 7-5.5 7-10V6Z" />
          <path d="m9.5 12 1.8 1.8 3.2-3.6" />
        </svg>
      );
    case "spark":
      return (
        <svg {...baseProps}>
          <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
          <path d="m19 4 .8 2.2L22 7l-2.2.8L19 10l-.8-2.2L16 7l2.2-.8Z" />
        </svg>
      );
    case "task_alt":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12 2.5 2.5 4.5-5" />
        </svg>
      );
    case "trending_down":
      return (
        <svg {...baseProps}>
          <path d="m4 7 6 6 4-4 6 6" />
          <path d="M20 12v6h-6" />
        </svg>
      );
    case "trending_up":
      return (
        <svg {...baseProps}>
          <path d="m4 17 6-6 4 4 6-6" />
          <path d="M20 12V6h-6" />
        </svg>
      );
    default:
      return null;
  }
}
