"use client";

import { skeletonBlockClass } from "@/components/app/ui";

type LoadingSkeletonProps = {
  rows?: number;
};

export default function LoadingSkeleton({
  rows = 4,
}: LoadingSkeletonProps) {
  return (
    <div className="app-skeleton-card overflow-hidden p-6">
      <div className={`${skeletonBlockClass} h-5 w-40`} />
      <div className={`mt-3 ${skeletonBlockClass} h-4 w-64`} />
      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={`skeleton-row-${index}`}
            className={`${skeletonBlockClass} h-12 w-full`}
          />
        ))}
      </div>
    </div>
  );
}
