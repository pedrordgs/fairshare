import React from "react";

export interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalContent: React.FC<ModalContentProps> = ({
  children,
  className = "",
}) => {
  return <div className={`px-8 pb-8 ${className}`}>{children}</div>;
};
