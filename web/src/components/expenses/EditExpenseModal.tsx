import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { type Expense } from "@schema/expenses";
import { EditExpenseForm } from "./EditExpenseForm";

interface EditExpenseModalProps {
  groupId: number;
  expense: Expense;
  isOpen: boolean;
  onClose: () => void;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  groupId,
  expense,
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
      titleId="edit-expense-modal-title"
      descriptionId="edit-expense-modal-description"
    >
      <ModalHeader
        title="Edit Expense"
        description="Update the expense details below."
        onClose={onClose}
        titleId="edit-expense-modal-title"
        descriptionId="edit-expense-modal-description"
      />
      <ModalContent>
        <EditExpenseForm
          groupId={groupId}
          expense={expense}
          onSuccess={onClose}
        />
      </ModalContent>
    </Modal>
  );
};
