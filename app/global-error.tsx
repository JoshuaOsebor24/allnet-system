"use client";

import ErrorState from "@/components/app/ErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[var(--background)]">
        <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <ErrorState
              title="System error"
              description={
                error.message ||
                "A critical platform error occurred. Retry to restore the current session."
              }
              onRetry={reset}
            />
          </div>
        </main>
      </body>
    </html>
  );
}
