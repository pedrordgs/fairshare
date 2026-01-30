import React from "react";
import { Modal, ModalHeader, ModalContent } from "@components/ui/Modal";
import { AuthTabs } from "./AuthTabs";
import { useNavigate } from "@tanstack/react-router";
import { useAuthModal } from "@hooks/useAuthModal";

/**
 * Global authentication modal component.
 *
 * This modal is rendered at the root level of the app and can be triggered
 * from anywhere using the useAuthModal hook. It provides a centralized
 * way to handle user authentication flows.
 *
 * The modal automatically handles:
 * - Opening/closing via global state
 * - Navigation after successful login/register
 * - Remembering the intended destination for post-auth redirects
 *
 * @example
 * ```tsx
 * // In your component
 * const { openAuthModal } = useAuthModal();
 *
 * // Open login modal
 * <Button onClick={() => openAuthModal({ tab: 'login' })}>
 *   Log In
 * </Button>
 *
 * // Open register modal with redirect
 * <Button onClick={() => openAuthModal({ tab: 'register', redirectTo: '/dashboard' })}>
 *   Sign Up
 * </Button>
 * ```
 */
export const AuthModal: React.FC = () => {
  const navigate = useNavigate();
  const { isOpen, initialTab, redirectTo, closeAuthModal } = useAuthModal();

  const handleClose = () => {
    closeAuthModal();
  };

  const handleSuccess = () => {
    // Close modal and navigate to intended destination
    closeAuthModal();
    // Navigate to redirect location or dashboard
    navigate({ to: redirectTo || "/dashboard" });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-md w-full"
      titleId="auth-modal-title"
      descriptionId="auth-modal-description"
    >
      <ModalHeader
        title="Welcome to FairShare"
        description="Split expenses fairly with friends, family, and roommates."
        onClose={handleClose}
        titleId="auth-modal-title"
        descriptionId="auth-modal-description"
      />
      <ModalContent>
        <AuthTabs onSuccess={handleSuccess} initialTab={initialTab} />
      </ModalContent>
    </Modal>
  );
};
