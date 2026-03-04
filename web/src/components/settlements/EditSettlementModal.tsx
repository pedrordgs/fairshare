import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { EditSettlementForm } from "./EditSettlementForm";
import type { GroupSettlementListItem } from "@schema/settlements";

interface EditSettlementModalProps {
  groupId: number;
  settlement: GroupSettlementListItem;
  membersById: Map<number, string>;
  isOpen: boolean;
  onClose: () => void;
}

export const EditSettlementModal: React.FC<EditSettlementModalProps> = ({
  groupId,
  settlement,
  membersById,
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
      titleId="edit-settlement-modal-title"
      descriptionId="edit-settlement-modal-description"
    >
      <ModalHeader
        title="Edit Settlement"
        description="Update the payment amount or payee."
        onClose={onClose}
        titleId="edit-settlement-modal-title"
        descriptionId="edit-settlement-modal-description"
      />
      <ModalContent>
        <EditSettlementForm
          groupId={groupId}
          settlement={settlement}
          membersById={membersById}
          onSuccess={onClose}
        />
      </ModalContent>
    </Modal>
  );
};
