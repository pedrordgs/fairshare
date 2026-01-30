import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { CreateGroupForm } from "./CreateGroupForm";
import { useCreateGroupModal } from "@hooks/useCreateGroupModal";

/**
 * Global create group modal component.
 *
 * This modal is rendered at the root level of the app and can be triggered
 * from anywhere using the useCreateGroupModal hook.
 *
 * @example
 * ```tsx
 * const { openCreateGroupModal } = useCreateGroupModal();
 *
 * <Button onClick={openCreateGroupModal}>Create Group</Button>
 * ```
 */
export const CreateGroupModal: React.FC = () => {
  const { isOpen, closeCreateGroupModal } = useCreateGroupModal();

  const handleSuccess = () => {
    closeCreateGroupModal();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeCreateGroupModal}
      className="max-w-md w-full"
      titleId="create-group-modal-title"
      descriptionId="create-group-modal-description"
    >
      <ModalHeader
        title="Create New Group"
        description="Start a new expense group for trips, bills, or events."
        onClose={closeCreateGroupModal}
        titleId="create-group-modal-title"
        descriptionId="create-group-modal-description"
      />
      <ModalContent>
        <CreateGroupForm onSuccess={handleSuccess} />
      </ModalContent>
    </Modal>
  );
};
