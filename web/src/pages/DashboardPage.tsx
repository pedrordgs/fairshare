import React from "react";
import { Button } from "@components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";

import { useAuth } from "@context/AuthContext";
import { useCreateGroupModal } from "@hooks/useCreateGroupModal";
import { useJoinGroupModal } from "@hooks/useJoinGroupModal";
import { CreateGroupModal } from "@components/groups/CreateGroupModal";
import { JoinGroupModal } from "@components/groups/JoinGroupModal";
import { GroupsList } from "@components/groups/GroupsList";

export const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { openCreateGroupModal } = useCreateGroupModal();
  const { openJoinGroupModal } = useJoinGroupModal();

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
    // Render nothing while the auth guard or logout redirects to "/"
    return null;
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
              <Button className="w-full" onClick={openCreateGroupModal}>
                Create Group
              </Button>
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
              <CardTitle>Join a Group</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Have a code? Join a group instantly and start tracking expenses.
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={openJoinGroupModal}
              >
                Enter Code
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Groups Section */}
        <GroupsList onCreateGroup={openCreateGroupModal} />
      </div>
      <CreateGroupModal />
      <JoinGroupModal />
    </div>
  );
};
