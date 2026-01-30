import React from "react";
import {
  ErrorIcon,
  InfoIcon,
  SuccessIcon,
  WarningIcon,
} from "../../../assets/icons/alert-icons";

export interface AlertProps {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = "info",
  className = "",
}) => {
  const baseClasses = "p-4 rounded-lg border flex items-start gap-3";

  const variantClasses = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800",
  }[variant];

  const icons = {
    info: <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />,
    success: <SuccessIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />,
    warning: <WarningIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />,
    error: <ErrorIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />,
  };

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`}>
      {icons[variant]}
      <div className="flex-1">{children}</div>
    </div>
  );
};
