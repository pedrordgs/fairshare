import React from "react";

export interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalContent: React.FC<ModalContentProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`px-8 pb-8 relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/50 to-transparent pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  );
};
