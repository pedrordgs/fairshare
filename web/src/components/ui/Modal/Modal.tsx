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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-slate-800/30 to-slate-900/40 backdrop-blur-md pointer-events-none" />
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
      </div>

      <div
        ref={modalRef}
        className={`
          relative bg-gradient-to-br from-white via-white to-slate-50/90 
          border border-slate-200/50 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]
          backdrop-blur-xl max-w-lg w-full max-h-[90vh] overflow-y-auto
          animate-slide-up transform transition-all duration-500 ease-out
          before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br 
          before:from-transparent before:to-slate-900/5 before:pointer-events-none
          after:absolute after:inset-0 after:rounded-2xl after:border after:border-white/20 
          after:pointer-events-none
          md:mx-4
          ${className}
        `}
        tabIndex={-1}
        style={{
          animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
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
