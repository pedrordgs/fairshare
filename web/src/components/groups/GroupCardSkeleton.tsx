import React from "react";
import { Card, CardContent, CardHeader } from "@components/ui/Card";

export const GroupCardSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="pr-16">
          <div className="h-6 bg-slate-200 rounded w-3/4 animate-pulse" />
        </div>
        <div className="h-4 bg-slate-200 rounded w-1/3 mt-2 animate-pulse" />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Balance Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 bg-slate-200 rounded w-16 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
        </div>

        {/* Stats Row Skeleton */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <div className="h-4 bg-slate-200 rounded w-4 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-20 animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-4 bg-slate-200 rounded w-4 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
