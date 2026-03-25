import LoadingSkeleton from "@/components/app/LoadingSkeleton";

export default function RootLoading() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="app-skeleton-card p-6">
          <div className="skeleton-shimmer h-6 w-44 rounded-[var(--radius-sm)]" />
          <div className="mt-3 skeleton-shimmer h-4 w-80 rounded-[var(--radius-sm)]" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <LoadingSkeleton rows={6} />
          <div className="space-y-6">
            <LoadingSkeleton rows={4} />
            <LoadingSkeleton rows={5} />
          </div>
        </div>
      </div>
    </main>
  );
}
