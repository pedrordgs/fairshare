import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { ButtonPrimary, ButtonSecondary } from "@components/ui/Button";
import { LoadingSpinnerIcon } from "@assets/icons/loading-icons";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isPending: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isPending,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md w-full"
      titleId="confirmation-modal-title"
      descriptionId="confirmation-modal-description"
    >
      <ModalHeader
        title={title}
        onClose={onClose}
        titleId="confirmation-modal-title"
        descriptionId="confirmation-modal-description"
      />
      <ModalContent>
        <p id="confirmation-modal-description" className="text-slate-700 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <ButtonSecondary type="button" onClick={onClose}>
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
