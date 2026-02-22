import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { JoinGroupForm } from "./JoinGroupForm";
import { useJoinGroupModal } from "@hooks/useJoinGroupModal";

/**
 * Global join group modal component.
 */
export const JoinGroupModal: React.FC = () => {
  const { isOpen, closeJoinGroupModal } = useJoinGroupModal();

  const handleSuccess = () => {
    closeJoinGroupModal();
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
