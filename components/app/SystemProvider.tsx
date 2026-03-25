"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { createId, triggerDownload } from "@/components/app/utils";
import { secondaryButtonClass } from "@/components/app/ui";

export type CourseStatus =
  | "Open"
  | "Full"
  | "In progress"
  | "Scheduled"
  | "Completed"
  | "Review due";
export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export type BookingType = "Virtual" | "In-person";
export type DelegateProgress = "In training" | "Completed";
export type CertificateStatus = "Pending" | "Issued";
export type UserRole = "Admin" | "Operations" | "Compliance" | "Client";
export type UserStatus = "Active" | "Inactive" | "Pending MFA" | "Suspended";

export type Course = {
  id: string;
  code: string;
  name: string;
  summary: string;
  category: string;
  owner: string;
  nextSession: string;
  seatsFilled: number;
  seatsTotal: number;
  status: CourseStatus;
};

export type Booking = {
  id: string;
  delegateName: string;
  courseName: string;
  type: BookingType;
  date: string;
  status: BookingStatus;
  trainer?: string;
};

export type Delegate = {
  id: string;
  recordId: string;
  name: string;
  company: string;
  courseName: string;
  progress: DelegateProgress;
  certificateStatus: CertificateStatus;
  expiry: string;
  followUpSent?: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team: string;
  company?: string;
  status: UserStatus;
  lastActive: string;
  passwordResetPending?: boolean;
};

type SummaryState = {
  mandatoryTrainingCompletion: number;
  auditPacksReady: number;
  activeDelegateCount: number;
};

type SystemState = {
  summary: SummaryState;
  courses: Course[];
  bookings: Booking[];
  delegates: Delegate[];
  users: User[];
};

type Toast = {
  id: string;
  message: string;
};

type SystemContextValue = {
  state: SystemState;
  addCourse: (input: Omit<Course, "id">) => void;
  updateCourse: (id: string, input: Omit<Course, "id">) => void;
  removeCourse: (id: string) => void;
  addBooking: (input: Omit<Booking, "id" | "status"> & { status?: BookingStatus }) => void;
  updateBooking: (id: string, input: Partial<Booking>) => void;
  cycleBookingStatus: (id: string) => void;
  addDelegate: (input: Omit<Delegate, "id" | "recordId">) => void;
  updateDelegate: (id: string, input: Partial<Delegate>) => void;
  addUser: (input: Omit<User, "id" | "lastActive">) => void;
  updateUser: (id: string, input: Partial<User>) => void;
  resetData: () => void;
  showToast: (message: string) => void;
  exportFile: (filename: string, contents: string, mimeType?: string) => void;
};

type Action =
  | { type: "hydrate"; payload: SystemState }
  | { type: "add_course"; payload: Course }
  | { type: "update_course"; payload: Course }
  | { type: "remove_course"; payload: string }
  | { type: "add_booking"; payload: Booking }
  | { type: "update_booking"; payload: { id: string; input: Partial<Booking> } }
  | { type: "cycle_booking"; payload: string }
  | { type: "add_delegate"; payload: Delegate }
  | { type: "update_delegate"; payload: { id: string; input: Partial<Delegate> } }
  | { type: "add_user"; payload: User }
  | { type: "update_user"; payload: { id: string; input: Partial<User> } }
  | { type: "reset" };

const STORAGE_KEY = "allnet-system-state";

const initialState: SystemState = {
  summary: {
    mandatoryTrainingCompletion: 98.4,
    auditPacksReady: 24,
    activeDelegateCount: 4892,
  },
  courses: [
    {
      id: "course-1",
      code: "IAPP-CIPPE",
      name: "CIPP/E",
      summary: "IAPP privacy certification",
      category: "Privacy",
      owner: "Ito",
      nextSession: "2026-03-26",
      seatsFilled: 18,
      seatsTotal: 20,
      status: "Open",
    },
    {
      id: "course-2",
      code: "IAPP-CIPM",
      name: "CIPM",
      summary: "Privacy management certification",
      category: "Privacy",
      owner: "Sarah Kendrick",
      nextSession: "2026-03-27",
      seatsFilled: 16,
      seatsTotal: 16,
      status: "Full",
    },
    {
      id: "course-3",
      code: "BCS-DP",
      name: "BCS Practitioner Certificate",
      summary: "UK GDPR and Data Protection Act training",
      category: "Data Protection",
      owner: "Marcus Reed",
      nextSession: "2026-03-29",
      seatsFilled: 4,
      seatsTotal: 12,
      status: "Scheduled",
    },
    {
      id: "course-4",
      code: "PECB-27001",
      name: "ISO 27001 Lead Implementer",
      summary: "ISMS implementation training",
      category: "Information Security",
      owner: "Unassigned",
      nextSession: "2026-03-31",
      seatsFilled: 22,
      seatsTotal: 24,
      status: "Review due",
    },
  ],
  bookings: [
    {
      id: "booking-1",
      delegateName: "Sarah Kendrick",
      courseName: "CIPP/E",
      type: "Virtual",
      date: "2026-03-26",
      status: "Confirmed",
      trainer: "Ito",
    },
    {
      id: "booking-2",
      delegateName: "Marcus Reed",
      courseName: "CIPM",
      type: "In-person",
      date: "2026-03-27",
      status: "Pending",
      trainer: "Sarah Kendrick",
    },
    {
      id: "booking-3",
      delegateName: "Elena Lopez",
      courseName: "BCS Practitioner Certificate",
      type: "Virtual",
      date: "2026-03-29",
      status: "Confirmed",
      trainer: "Marcus Reed",
    },
    {
      id: "booking-4",
      delegateName: "John Miller",
      courseName: "ISO 27001 Lead Implementer",
      type: "In-person",
      date: "2026-03-31",
      status: "Pending",
      trainer: "Unassigned",
    },
  ],
  delegates: [
    {
      id: "delegate-1",
      recordId: "DL-10422",
      name: "Sarah Kendrick",
      company: "Allied Maritime Ltd",
      courseName: "CIPP/E",
      progress: "Completed",
      certificateStatus: "Pending",
      expiry: "2026-03-28",
    },
    {
      id: "delegate-2",
      recordId: "DL-10384",
      name: "Marcus Reed",
      company: "Northgate Facilities",
      courseName: "CIPM",
      progress: "In training",
      certificateStatus: "Pending",
      expiry: "2026-03-29",
    },
    {
      id: "delegate-3",
      recordId: "DL-10311",
      name: "Elena Lopez",
      company: "Bramley Infrastructure",
      courseName: "BCS Practitioner Certificate",
      progress: "Completed",
      certificateStatus: "Issued",
      expiry: "2026-03-30",
    },
    {
      id: "delegate-4",
      recordId: "DL-10265",
      name: "David Byrne",
      company: "Kensworth Legal Services",
      courseName: "ISO 27001 Lead Implementer",
      progress: "In training",
      certificateStatus: "Pending",
      expiry: "2026-03-31",
    },
    {
      id: "delegate-5",
      recordId: "DL-10251",
      name: "Priya Nair",
      company: "Halden Energy",
      courseName: "CIPP/E",
      progress: "Completed",
      certificateStatus: "Issued",
      expiry: "2026-04-01",
    },
    {
      id: "delegate-6",
      recordId: "DL-10239",
      name: "James Walker",
      company: "Westbridge Utilities",
      courseName: "CIPM",
      progress: "Completed",
      certificateStatus: "Pending",
      expiry: "2026-04-03",
    },
    {
      id: "delegate-7",
      recordId: "DL-10210",
      name: "Amina Yusuf",
      company: "Northline Estates",
      courseName: "BCS Practitioner Certificate",
      progress: "In training",
      certificateStatus: "Pending",
      expiry: "2026-04-05",
    },
  ],
  users: [
    {
      id: "user-1",
      name: "Alex Chen",
      email: "alex.chen@allnetlaw.com",
      role: "Admin",
      team: "Platform Security",
      status: "Active",
      lastActive: "5 mins ago",
    },
    {
      id: "user-2",
      name: "Sarah Kendrick",
      email: "s.kendrick@allnetlaw.com",
      role: "Operations",
      team: "Operations",
      status: "Active",
      lastActive: "24 mins ago",
    },
    {
      id: "user-3",
      name: "John Miller",
      email: "j.miller@allnetlaw.com",
      role: "Compliance",
      team: "Compliance",
      status: "Pending MFA",
      lastActive: "Yesterday",
    },
    {
      id: "user-4",
      name: "Elena Lopez",
      email: "e.lopez@allnetlaw.com",
      role: "Client",
      team: "Client access",
      company: "Halden Energy",
      status: "Suspended",
      lastActive: "2 days ago",
    },
  ],
};

const SystemContext = createContext<SystemContextValue | null>(null);

function getDefaultTeamForRole(role: UserRole) {
  switch (role) {
    case "Admin":
      return "Platform Security";
    case "Compliance":
      return "Compliance";
    case "Client":
      return "Client access";
    default:
      return "Operations";
  }
}

function normalizeUserRole(value: unknown, legacyAccess?: unknown): UserRole {
  if (legacyAccess === "Admin" || value === "Administrator") {
    return "Admin";
  }

  if (
    value === "Compliance" ||
    value === "Compliance Manager" ||
    value === "Quality Reviewer" ||
    legacyAccess === "Reviewer"
  ) {
    return "Compliance";
  }

  if (value === "Client" || value === "Client Services") {
    return "Client";
  }

  return "Operations";
}

function normalizeUserStatus(value: unknown): UserStatus {
  switch (value) {
    case "Active":
    case "Inactive":
    case "Pending MFA":
    case "Suspended":
      return value;
    default:
      return "Active";
  }
}

function normalizeUser(raw: Partial<User> & { access?: unknown }): User {
  const role = normalizeUserRole(raw.role, raw.access);
  const team =
    typeof raw.team === "string" && raw.team.trim().length > 0
      ? raw.team
      : getDefaultTeamForRole(role);
  const company =
    typeof raw.company === "string" && raw.company.trim().length > 0
      ? raw.company
      : role === "Client"
        ? "Assigned client"
        : undefined;

  return {
    id: typeof raw.id === "string" ? raw.id : createId("user"),
    name: typeof raw.name === "string" ? raw.name : "Unknown user",
    email: typeof raw.email === "string" ? raw.email : "unknown@allnetlaw.com",
    role,
    team,
    company,
    status: normalizeUserStatus(raw.status),
    lastActive:
      typeof raw.lastActive === "string" ? raw.lastActive : "Just invited",
    passwordResetPending: Boolean(raw.passwordResetPending),
  };
}

function normalizeCourseStatus(value: unknown, seatsFilled?: unknown, seatsTotal?: unknown): CourseStatus {
  if (
    value === "Open" ||
    value === "Full" ||
    value === "In progress" ||
    value === "Scheduled" ||
    value === "Completed" ||
    value === "Review due"
  ) {
    return value;
  }

  const filled = typeof seatsFilled === "number" ? seatsFilled : Number(seatsFilled ?? 0);
  const total = typeof seatsTotal === "number" ? seatsTotal : Number(seatsTotal ?? 0);

  if (total > 0 && filled >= total) {
    return "Full";
  }

  return "Open";
}

function normalizeCourse(raw: Partial<Course>): Course {
  const seatsFilled =
    typeof raw.seatsFilled === "number" ? raw.seatsFilled : Number(raw.seatsFilled ?? 0);
  const seatsTotal =
    typeof raw.seatsTotal === "number" ? raw.seatsTotal : Number(raw.seatsTotal ?? 0);

  return {
    id: typeof raw.id === "string" ? raw.id : createId("course"),
    code: typeof raw.code === "string" ? raw.code : "COURSE",
    name: typeof raw.name === "string" ? raw.name : "Untitled course",
    summary: typeof raw.summary === "string" ? raw.summary : "Training programme",
    category: typeof raw.category === "string" ? raw.category : "Privacy",
    owner:
      typeof raw.owner === "string" && raw.owner.trim().length > 0
        ? raw.owner
        : "Unassigned",
    nextSession:
      typeof raw.nextSession === "string" ? raw.nextSession : "2026-03-25",
    seatsFilled,
    seatsTotal: seatsTotal > 0 ? seatsTotal : Math.max(seatsFilled, 1),
    status: normalizeCourseStatus(raw.status, seatsFilled, seatsTotal),
  };
}

function normalizeBookingStatus(value: unknown): BookingStatus {
  switch (value) {
    case "Pending":
    case "Confirmed":
    case "Completed":
    case "Cancelled":
      return value;
    default:
      return "Pending";
  }
}

function normalizeBooking(raw: Partial<Booking>, courses: Course[]): Booking {
  const matchedCourse = courses.find((course) => course.name === raw.courseName);
  const trainer =
    typeof raw.trainer === "string" && raw.trainer.trim().length > 0
      ? raw.trainer
      : matchedCourse?.owner ?? "Unassigned";

  return {
    id: typeof raw.id === "string" ? raw.id : createId("booking"),
    delegateName:
      typeof raw.delegateName === "string" ? raw.delegateName : "Unknown delegate",
    courseName: typeof raw.courseName === "string" ? raw.courseName : "Unassigned course",
    type: raw.type === "In-person" ? "In-person" : "Virtual",
    date: typeof raw.date === "string" ? raw.date : "2026-03-25",
    status: normalizeBookingStatus(raw.status),
    trainer,
  };
}

function normalizeState(rawState: SystemState): SystemState {
  const courses = Array.isArray(rawState.courses)
    ? rawState.courses.map((course) => normalizeCourse(course as Partial<Course>))
    : initialState.courses;

  return {
    ...rawState,
    courses,
    bookings: Array.isArray(rawState.bookings)
      ? rawState.bookings.map((booking) =>
          normalizeBooking(booking as Partial<Booking>, courses),
        )
      : initialState.bookings,
    users: Array.isArray(rawState.users)
      ? rawState.users.map((user) =>
          normalizeUser(user as Partial<User> & { access?: unknown }),
        )
      : initialState.users,
  };
}

function reducer(state: SystemState, action: Action): SystemState {
  switch (action.type) {
    case "hydrate":
      return normalizeState(action.payload);
    case "add_course":
      return { ...state, courses: [action.payload, ...state.courses] };
    case "update_course":
      return {
        ...state,
        courses: state.courses.map((course) =>
          course.id === action.payload.id ? action.payload : course,
        ),
      };
    case "remove_course":
      return {
        ...state,
        courses: state.courses.filter((course) => course.id !== action.payload),
      };
    case "add_booking":
      return { ...state, bookings: [action.payload, ...state.bookings] };
    case "update_booking":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.payload.id
            ? { ...booking, ...action.payload.input }
            : booking,
        ),
      };
    case "cycle_booking":
      return {
        ...state,
        bookings: state.bookings.map((booking) => {
          if (booking.id !== action.payload) {
            return booking;
          }

          if (booking.status === "Pending") {
            return { ...booking, status: "Confirmed" };
          }

          if (booking.status === "Confirmed") {
            return { ...booking, status: "Completed" };
          }

          if (booking.status === "Cancelled") {
            return booking;
          }

          return booking;
        }),
      };
    case "add_delegate":
      return {
        ...state,
        summary: {
          ...state.summary,
          activeDelegateCount: state.summary.activeDelegateCount + 1,
        },
        delegates: [action.payload, ...state.delegates],
      };
    case "update_delegate":
      return {
        ...state,
        delegates: state.delegates.map((delegate) =>
          delegate.id === action.payload.id
            ? { ...delegate, ...action.payload.input }
            : delegate,
        ),
      };
    case "add_user":
      return { ...state, users: [action.payload, ...state.users] };
    case "update_user":
      return {
        ...state,
        users: state.users.map((user) =>
          user.id === action.payload.id
            ? { ...user, ...action.payload.input }
            : user,
        ),
      };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

function loadState() {
  if (typeof window === "undefined") {
    return initialState;
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return initialState;
  }

  try {
    return normalizeState(JSON.parse(raw) as SystemState);
  } catch {
    return initialState;
  }
}

export function SystemProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    dispatch({ type: "hydrate", payload: loadState() });
    hasHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  const value: SystemContextValue = {
    state,
    addCourse(input) {
      dispatch({
        type: "add_course",
        payload: { id: createId("course"), ...input },
      });
      setToasts((current) => [
        ...current,
        { id: createId("toast"), message: "Course added" },
      ]);
    },
    updateCourse(id, input) {
      dispatch({
        type: "update_course",
        payload: { id, ...input },
      });
      setToasts((current) => [
        ...current,
        { id: createId("toast"), message: "Course updated" },
      ]);
    },
    removeCourse(id) {
      dispatch({ type: "remove_course", payload: id });
      setToasts((current) => [
        ...current,
        { id: createId("toast"), message: "Course deleted" },
      ]);
    },
    addBooking(input) {
      const course = state.courses.find((item) => item.name === input.courseName);
      dispatch({
        type: "add_booking",
        payload: {
          id: createId("booking"),
          status: input.status ?? "Pending",
          trainer: input.trainer ?? course?.owner ?? "Unassigned",
          ...input,
        },
      });
      setToasts((current) => [
        ...current,
        { id: createId("toast"), message: "Booking created" },
      ]);
    },
    updateBooking(id, input) {
      dispatch({ type: "update_booking", payload: { id, input } });
      setToasts((current) => [
        ...current,
        { id: createId("toast"), message: "Booking updated" },
      ]);
    },
    cycleBookingStatus(id) {
      dispatch({ type: "cycle_booking", payload: id });
      setToasts((current) => [
        ...current,
        { id: createId("toast"), message: "Booking updated" },
      ]);
    },
    addDelegate(input) {
      dispatch({
        type: "add_delegate",
        payload: {
          id: createId("delegate"),
          recordId: `DL-${Math.floor(Math.random() * 90000) + 10000}`,
          ...input,
        },
      });
      setToasts((current) => [
        ...current,
        { id: createId("toast"), message: "Delegate added" },
      ]);
    },
    updateDelegate(id, input) {
      dispatch({ type: "update_delegate", payload: { id, input } });
      setToasts((current) => [
        ...current,
        { id: createId("toast"), message: "Delegate updated" },
      ]);
    },
    addUser(input) {
      dispatch({
        type: "add_user",
        payload: {
          id: createId("user"),
          lastActive: "Just invited",
          passwordResetPending: false,
          ...input,
        },
      });
      setToasts((current) => [
        ...current,
        { id: createId("toast"), message: "User invited" },
      ]);
    },
    updateUser(id, input) {
      dispatch({
        type: "update_user",
        payload: {
          id,
          input,
        },
      });
      setToasts((current) => [
        ...current,
        { id: createId("toast"), message: "User updated" },
      ]);
    },
    resetData() {
      dispatch({ type: "reset" });
      window.sessionStorage.removeItem(STORAGE_KEY);
      setToasts((current) => [
        ...current,
        { id: createId("toast"), message: "Session data reset" },
      ]);
    },
    showToast(message) {
      setToasts((current) => [...current, { id: createId("toast"), message }]);
    },
    exportFile(filename, contents, mimeType) {
      triggerDownload(filename, contents, mimeType);
      setToasts((current) => [
        ...current,
        { id: createId("toast"), message: `${filename} exported` },
      ]);
    },
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-950">
                {toast.message}
              </p>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() =>
                  setToasts((current) =>
                    current.filter((item) => item.id !== toast.id),
                  )
                }
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const value = useContext(SystemContext);

  if (!value) {
    throw new Error("useSystem must be used within a SystemProvider");
  }

  return value;
}
