import React from "react";
import { formatCurrency } from "@utils/formatUtils";

interface DashboardWelcomeProps {
  name: string;
  totalGroups: number;
  totalOwed: number;
  totalOwedToUser: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getFirstName(fullName: string): string {
  return fullName.split(" ")[0];
}

export const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({
  name,
  totalGroups,
  totalOwed,
  totalOwedToUser,
}) => {
  const isSettled = totalOwed === 0 && totalOwedToUser === 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-8 border-b border-primary-100">
      {/* Greeting */}
      <div>
        <p className="text-sm text-slate-500">{getGreeting()},</p>
        <h1 className="text-2xl font-bold text-slate-900">
          {getFirstName(name)}
        </h1>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-2">
        {/* You owe */}
        {totalOwed !== 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-100">
            <span className="text-xs uppercase tracking-wide text-rose-600 font-medium">
              You owe
            </span>
            <span className="text-sm font-bold text-rose-700">
              {formatCurrency(totalOwed)}
            </span>
          </div>
        )}

        {/* Owed to you */}
        {totalOwedToUser !== 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
            <span className="text-xs uppercase tracking-wide text-emerald-600 font-medium">
              Owed to you
            </span>
            <span className="text-sm font-bold text-emerald-700">
              {formatCurrency(totalOwedToUser)}
            </span>
          </div>
        )}

        {/* Settled badge */}
        {isSettled && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-50 border border-accent-100">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
            <span className="text-xs font-medium text-accent-700">
              All settled
            </span>
          </div>
        )}

        {/* Groups count */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-100">
          <span className="text-xs uppercase tracking-wide text-primary-500 font-medium">
            Groups
          </span>
          <span className="text-sm font-bold text-slate-800">
            {totalGroups}
          </span>
        </div>
      </div>
    </div>
  );
};
