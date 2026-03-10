import React from "react";
import { SettlementHistory } from "@components/settlements/SettlementHistory";

interface SettlementsTabProps {
  groupId: number;
  membersById: Map<number, string>;
  currentUserId: number | null;
  isActive: boolean;
}

export const SettlementsTab: React.FC<SettlementsTabProps> = ({
  groupId,
  membersById,
  currentUserId,
  isActive,
}) => {
  return (
    <SettlementHistory
      groupId={groupId}
      membersById={membersById}
      currentUserId={currentUserId}
      embedded
      enabled={isActive}
    />
  );
};
