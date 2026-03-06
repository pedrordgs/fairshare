import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { AddExpenseForm } from "./AddExpenseForm";
import type { ExpenseGroupMemberPublic } from "@schema/groups";

interface AddExpenseModalProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  members?: ExpenseGroupMemberPublic[];
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  groupId,
  isOpen,
  onClose,
  isAdmin = false,
  members = [],
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md w-full"
      titleId="add-expense-modal-title"
      descriptionId="add-expense-modal-description"
    >
      <ModalHeader
        title="Add an Expense"
        description="Split the cost equally across all group members."
        onClose={onClose}
        titleId="add-expense-modal-title"
        descriptionId="add-expense-modal-description"
      />
      <ModalContent>
        <AddExpenseForm
          groupId={groupId}
          isAdmin={isAdmin}
          members={members}
          onSuccess={onClose}
        />
      </ModalContent>
    </Modal>
  );
};
