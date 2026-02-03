import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { CreateGroupForm } from "./CreateGroupForm";
import { useCreateGroupModal } from "@hooks/useCreateGroupModal";
import { type ExpenseGroup } from "@schema/groups";
import { logError } from "@utils/errorUtils";
import { toast } from "react-hot-toast";

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
  const navigate = useNavigate();

  const handleSuccess = (group: ExpenseGroup) => {
    closeCreateGroupModal();
    try {
      navigate({
        to: "/groups/$groupId",
        params: { groupId: String(group.id) },
      });
    } catch (navError) {
      logError("UNKNOWN", navError as Error, {
        groupId: group.id,
        destination: "/groups/$groupId",
        component: "CreateGroupModal",
      });
      toast.error(
        "Group created but couldn't navigate to it. Please find it in your dashboard.",
      );
      navigate({ to: "/dashboard" });
    }
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
