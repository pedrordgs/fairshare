import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  titleId?: string;
  descriptionId?: string;
}

// Hoisted static class strings to avoid recreating on each render
const BACKDROP_CLASSES =
  "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4";
// Single backdrop div — no backdrop-filter to avoid full-page GPU compositing layer
const BACKDROP_OVERLAY_CLASSES =
  "absolute inset-0 bg-slate-900/50 pointer-events-none";

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  titleId = "modal-title",
  descriptionId = "modal-description",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen, onClose]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll
      document.body.style.overflow = "";

      // Restore focus to previous element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={BACKDROP_CLASSES}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className={BACKDROP_OVERLAY_CLASSES} />

      <div
        ref={modalRef}
        className={`
          relative bg-white border border-slate-200/50 rounded-2xl
          shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]
          max-w-lg w-full max-h-[90vh] overflow-y-auto
          mx-0 sm:mx-4
          ${className}
        `}
        tabIndex={-1}
        style={{
          animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        }}
      >
        {children}
      </div>
    </div>
  );

  // Use portal to render modal outside the component tree
  const modalRoot = document.getElementById("modal-root");
  if (modalRoot) {
    return createPortal(modalContent, modalRoot);
  }

  // Fallback to rendering in-place if modal-root doesn't exist
  return modalContent;
};
