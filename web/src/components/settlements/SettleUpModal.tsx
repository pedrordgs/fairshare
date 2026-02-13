import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { SettleUpForm } from "./SettleUpForm";
import type { ExpenseGroupDebtItem } from "@schema/groups";

interface SettleUpModalProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
  owedByUser: ExpenseGroupDebtItem[];
  membersById: Map<number, string>;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  groupId,
  isOpen,
  onClose,
  owedByUser,
  membersById,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md w-full"
      titleId="settle-up-modal-title"
      descriptionId="settle-up-modal-description"
    >
      <ModalHeader
        title="Settle Up"
        description="Record a payment to reduce what you owe."
        onClose={onClose}
        titleId="settle-up-modal-title"
        descriptionId="settle-up-modal-description"
      />
      <ModalContent>
        <SettleUpForm
          groupId={groupId}
          owedByUser={owedByUser}
          membersById={membersById}
          onSuccess={onClose}
        />
      </ModalContent>
    </Modal>
  );
};
