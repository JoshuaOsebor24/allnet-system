"use client";

import ErrorState from "@/components/app/ErrorState";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title="Something interrupted the platform view"
          description={
            error.message ||
            "The page could not finish loading. Retry the view or return to the previous workflow."
          }
          onRetry={reset}
        />
      </div>
    </main>
  );
}
