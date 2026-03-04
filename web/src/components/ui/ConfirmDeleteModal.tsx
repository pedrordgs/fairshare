import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { ButtonPrimary, ButtonSecondary } from "@components/ui/Button";
import { LoadingSpinnerIcon } from "@assets/icons/loading-icons";

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  isPending: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  isPending,
}) => {
  const handleClose = () => {
    if (!isPending) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-md w-full"
      titleId="confirm-delete-modal-title"
      descriptionId="confirm-delete-modal-description"
    >
      <ModalHeader
        title="Confirm Delete"
        onClose={handleClose}
        titleId="confirm-delete-modal-title"
        descriptionId="confirm-delete-modal-description"
      />
      <ModalContent>
        <p
          id="confirm-delete-modal-description"
          className="text-slate-700 mb-6"
        >
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <ButtonSecondary
            type="button"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </ButtonSecondary>
          <ButtonPrimary
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-500"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinnerIcon className="w-4 h-4 animate-spin" />
                Deleting...
              </span>
            ) : (
              "Delete"
            )}
          </ButtonPrimary>
        </div>
      </ModalContent>
    </Modal>
  );
};
