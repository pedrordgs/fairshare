import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { ProfileForm } from "./ProfileForm";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
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
      titleId="profile-modal-title"
      descriptionId="profile-modal-description"
    >
      <ModalHeader
        title="Profile"
        description="Update your display name for groups and activity."
        onClose={onClose}
        titleId="profile-modal-title"
        descriptionId="profile-modal-description"
      />
      <ModalContent>
        <ProfileForm onSuccess={onClose} />
      </ModalContent>
    </Modal>
  );
};
