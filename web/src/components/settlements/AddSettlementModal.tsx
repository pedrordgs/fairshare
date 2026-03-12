import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { AddSettlementForm } from "./AddSettlementForm";
import type {
  ExpenseGroupMemberPublic,
  GroupTransferItem,
} from "@schema/groups";

interface AddSettlementModalProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
  members: ExpenseGroupMemberPublic[];
  groupTransfers: GroupTransferItem[];
  membersById: Map<number, string>;
}

export const AddSettlementModal: React.FC<AddSettlementModalProps> = ({
  groupId,
  isOpen,
  onClose,
  members,
  groupTransfers,
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
      titleId="add-settlement-modal-title"
      descriptionId="add-settlement-modal-description"
    >
      <ModalHeader
        title="Add Settlement"
        description="Record a payment between any two group members."
        onClose={onClose}
        titleId="add-settlement-modal-title"
        descriptionId="add-settlement-modal-description"
      />
      <ModalContent>
        <AddSettlementForm
          groupId={groupId}
          members={members}
          groupTransfers={groupTransfers}
          membersById={membersById}
          onSuccess={onClose}
        />
      </ModalContent>
    </Modal>
  );
};
