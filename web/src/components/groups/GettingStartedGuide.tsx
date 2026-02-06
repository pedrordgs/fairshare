import React from "react";
import { Button } from "@components/ui/Button";

interface GettingStartedGuideProps {
  onCreateGroup: () => void;
}

export const GettingStartedGuide: React.FC<GettingStartedGuideProps> = ({
  onCreateGroup,
}) => {
  return (
    <div className="bg-white rounded-xl border border-primary-100 p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-accent-100 to-accent-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-accent-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Welcome to FairShare!
        </h2>
        <p className="text-slate-600 max-w-md mx-auto">
          You haven't joined any groups yet. Get started by creating your first
          expense group.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="flex flex-col items-center text-center p-4 bg-primary-50 rounded-lg">
          <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold mb-3">
            1
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Create a Group</h3>
          <p className="text-sm text-slate-600">
            Set up a group for trips, bills, or events
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-4 bg-primary-50 rounded-lg">
          <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold mb-3">
            2
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Add Members</h3>
          <p className="text-sm text-slate-600">
            Invite friends to join your group
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-4 bg-primary-50 rounded-lg">
          <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold mb-3">
            3
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Track Expenses</h3>
          <p className="text-sm text-slate-600">
            Add expenses and split costs fairly
          </p>
        </div>
      </div>

      <div className="text-center">
        <Button size="lg" onClick={onCreateGroup}>
          Create Your First Group
        </Button>
      </div>
    </div>
  );
};
