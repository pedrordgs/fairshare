import React from "react";

export const GroupRowSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-white border border-primary-100 animate-pulse sm:flex-row sm:items-center">
      {/* Name + date */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-40 bg-primary-100 rounded" />
        <div className="h-3 w-24 bg-primary-100 rounded" />
      </div>

      {/* Balance chips */}
      <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
        <div className="h-8 w-28 bg-rose-50 rounded-lg" />
        <div className="h-8 w-28 bg-emerald-50 rounded-lg" />
      </div>

      {/* Stats + actions */}
      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-3 w-16 bg-primary-100 rounded" />
          <div className="h-3 w-12 bg-primary-100 rounded" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-7 w-7 bg-primary-100 rounded" />
          <div className="h-7 w-7 bg-primary-100 rounded" />
        </div>
      </div>
    </div>
  );
};
