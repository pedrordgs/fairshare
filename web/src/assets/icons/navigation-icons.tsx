import React from "react";

interface IconProps {
  className?: string;
}

export const CloseIcon: React.FC<IconProps> = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);
