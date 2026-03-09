import React from "react";

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
      <GroupsList
        onCreateGroup={openCreateGroupModal}
        onJoinGroup={openJoinGroupModal}
      />
      <CreateGroupModal />
      <JoinGroupModal />
    </div>
  );
};
