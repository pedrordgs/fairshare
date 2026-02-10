import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { JoinGroupForm } from "./JoinGroupForm";
import { useJoinGroupModal } from "@hooks/useJoinGroupModal";
import { type ExpenseGroupDetail } from "@schema/groups";
import { logError } from "@utils/errorUtils";
import { toast } from "sonner";

/**
 * Global join group modal component.
 */
export const JoinGroupModal: React.FC = () => {
  const { isOpen, closeJoinGroupModal } = useJoinGroupModal();
  const navigate = useNavigate();

  const handleSuccess = (group: ExpenseGroupDetail) => {
    closeJoinGroupModal();
    try {
      navigate({
        to: "/groups/$groupId",
        params: { groupId: String(group.id) },
      });
    } catch (navError) {
      logError("UNKNOWN", navError as Error, {
        groupId: group.id,
        destination: "/groups/$groupId",
        component: "JoinGroupModal",
      });
      toast.error(
        "Joined the group but couldn't navigate to it. Please find it in your dashboard.",
      );
      navigate({ to: "/dashboard" });
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeJoinGroupModal}
      className="max-w-md w-full"
      titleId="join-group-modal-title"
      descriptionId="join-group-modal-description"
    >
      <ModalHeader
        title="Join a Group"
        description="Enter the invite code shared by your group organizer."
        onClose={closeJoinGroupModal}
        titleId="join-group-modal-title"
        descriptionId="join-group-modal-description"
      />
      <ModalContent>
        <JoinGroupForm onSuccess={handleSuccess} />
      </ModalContent>
    </Modal>
  );
};
