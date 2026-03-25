"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/utils/supabase/client";
import {
  fieldClass,
  labelClass,
  panelClass,
  primaryButtonClass,
} from "@/components/app/ui";

export default function LoginForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("LOGIN CLICKED", { email });
    setSubmitting(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("LOGIN RESULT", { data, error });

      if (error) {
        setErrorMessage(error.message);
        setSubmitting(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("LOGIN CRASHED", err);
      setErrorMessage(err instanceof Error ? err.message : "Unexpected error");
      setSubmitting(false);
    }
  }
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-6 lg:grid-cols-[minmax(0,1.05fr),520px]">
        <section className="order-2 rounded-[var(--radius-lg)] border border-slate-200/80 bg-white p-8 shadow-[var(--shadow-sm),var(--shadow-md)] lg:order-1 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4f6d78]">
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
            <h1 className="text-4xl font-semibold text-slate-950">
              Compliance Platform
            </h1>
            <p className="mt-4 text-base text-slate-600">
              Internal system for training delivery, bookings, delegate
              workflow, reporting, and audit readiness.
            </p>
          </div>
        </section>

        <section className="order-1 lg:order-2">
          <div className={`${panelClass} mx-auto w-full max-w-[520px] p-8`}>
            <h2 className="text-2xl font-semibold text-slate-950">Sign in</h2>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className={labelClass}>Email</span>
                <input
                  type="email"
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
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${fieldClass} pr-20`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-2 text-sm text-blue-600"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Remember me
              </label>

              <button
                type="submit"
                className={`${primaryButtonClass} w-full`}
                disabled={submitting}
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>

              {errorMessage ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function AllnetLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 130" className={className} aria-hidden="true">
      <rect width="130" height="130" fill="#506F7A" />
    </svg>
  );
}
