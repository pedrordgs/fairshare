import React from "react";
import { Button } from "@components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";
import { useNavigate } from "@tanstack/react-router";

import { useAuth } from "@context/AuthContext";

export const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // This shouldn't happen with auth guards, but as a fallback
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Access Denied
          </h1>
          <p className="text-slate-600 mb-6">
            Please sign in to access your dashboard.
          </p>
          <Button onClick={() => navigate({ to: "/" })}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max section-padding">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center fade-in">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Ready to split expenses fairly? This is your command center for
            managing groups, tracking expenses, and settling up with friends.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 slide-up stagger-1">
          <Card className="hover:shadow-md transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle>Create New Group</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Start a new expense group for trips, household bills, or events.
              </p>
              <Button className="w-full">Create Group</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle>Add Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Quick add a new expense to any of your existing groups.
              </p>
              <Button variant="secondary" className="w-full">
                Add Expense
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle>Invite Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Bring more people into your groups to split costs together.
              </p>
              <Button variant="secondary" className="w-full">
                Send Invite
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card className="slide-up stagger-2">
          <CardHeader>
            <CardTitle className="text-2xl">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-primary-50 rounded-lg">
                <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Create Your First Group
                  </h3>
                  <p className="text-slate-600">
                    Set up a group for your next trip, household, or event.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-primary-50 rounded-lg">
                <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Add Members</h3>
                  <p className="text-slate-600">
                    Invite friends, family, or roommates to join your group.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-primary-50 rounded-lg">
                <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Start Splitting Expenses
                  </h3>
                  <p className="text-slate-600">
                    Add expenses and watch the magic happen!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
