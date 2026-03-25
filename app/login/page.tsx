"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  fieldClass,
  labelClass,
  panelClass,
  primaryButtonClass,
} from "@/components/app/ui";
import { AppIcon } from "@/components/dashboard/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-6 lg:grid-cols-[minmax(0,1.05fr),520px]">
        <section className="order-2 rounded-[var(--radius-lg)] border border-slate-200/80 bg-white p-8 shadow-[var(--shadow-sm),var(--shadow-md)] lg:order-1 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4f6d78] shadow-[0_1px_2px_rgba(11,60,145,0.12),0_8px_18px_rgba(11,60,145,0.16)]">
              <AllnetLogo className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                ALLNET LAW
              </p>
              <p className="text-sm font-medium text-slate-700">
                Internal platform access
              </p>
            </div>
          </div>

          <div className="mt-8 max-w-xl">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              Compliance Platform
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Internal system for training delivery, bookings, delegate workflow,
              reporting, and audit readiness across active compliance programmes.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {[
              "Course and booking oversight",
              "Delegate and certificate tracking",
              "Reporting and compliance controls",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                  <AppIcon name="check_circle" className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium text-slate-800">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[var(--primary)] shadow-[var(--shadow-sm)]">
                <AppIcon name="shield" className="h-4 w-4" />
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Restricted to authorised internal users and approved client access.
              </p>
            </div>
          </div>
        </section>

        <section className="order-1 lg:order-2">
          <div className={`${panelClass} mx-auto w-full max-w-[520px] p-8 lg:p-9`}>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Sign in
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Access the internal compliance system
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className={labelClass}>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={fieldClass}
                  placeholder="name@allnetlaw.com"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className={labelClass}>Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${fieldClass} pr-24`}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 inline-flex items-center text-sm font-medium text-[var(--primary)] transition-colors duration-150 hover:text-[var(--primary-strong)]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary-soft)]"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-[var(--primary)] transition-colors duration-150 hover:text-[var(--primary-strong)]"
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" className={`${primaryButtonClass} w-full`}>
                Sign in
              </button>

              <p className="text-center text-sm leading-6 text-slate-500">
                Need help accessing the platform? Contact your administrator.
              </p>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[var(--primary)] shadow-[var(--shadow-sm)]">
                    <AppIcon name="shield" className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    Your access is logged and protected by platform security
                    controls.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
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
      <path d="M60 6 109 124H91L47 23 60 6Z" fill="#19E0C3" />
      <path
        d="M26 88c0-11 8.8-19.9 19.7-19.9 11.8 0 21.5 8.8 21.5 20.6C67.2 101.6 57 112 42.9 112 31.7 112 26 101.6 26 88Z"
        fill="#19E0C3"
      />
    </svg>
  );
}
