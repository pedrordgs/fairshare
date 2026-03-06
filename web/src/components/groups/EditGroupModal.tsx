import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { EditGroupForm } from "./EditGroupForm";
import { type ExpenseGroupDetail } from "@schema/groups";

interface EditGroupModalProps {
  group: ExpenseGroupDetail;
  isOpen: boolean;
  onClose: () => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  group,
  isOpen,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md w-full"
      titleId="edit-group-modal-title"
      descriptionId="edit-group-modal-description"
    >
      <ModalHeader
        title="Edit Group"
        description="Update the name of your group."
        onClose={onClose}
        titleId="edit-group-modal-title"
        descriptionId="edit-group-modal-description"
      />
      <ModalContent>
        <EditGroupForm group={group} onSuccess={onClose} />
      </ModalContent>
    </Modal>
  );
};
