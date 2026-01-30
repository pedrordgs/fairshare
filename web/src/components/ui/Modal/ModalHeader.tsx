import React from "react";
import { Button } from "@components/ui/Button";

export interface ModalHeaderProps {
  title: string;
  description?: string;
  onClose: () => void;
  className?: string;
  titleId?: string;
  descriptionId?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  description,
  onClose,
  className = "",
  titleId = "modal-title",
  descriptionId = "modal-description",
}) => {
  return (
    <div
      className={`flex items-start justify-between p-8 pb-6 relative ${className}`}
    >
      <div className="absolute top-0 left-8 w-12 h-1 bg-gradient-to-r from-accent-400 to-transparent rounded-full" />

      <div className="flex-1">
        <h2
          id={titleId}
          className="text-3xl font-light tracking-tight text-slate-900 font-serif mb-3"
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            id={descriptionId}
            className="text-slate-600 leading-relaxed text-sm font-light tracking-wide"
            style={{
              lineHeight: "1.6",
            }}
          >
            {description}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="ml-6 text-slate-400 hover:text-slate-700 p-2.5 rounded-full
                   transition-all duration-300 hover:bg-slate-100/50 group"
        aria-label="Close modal"
      >
        <svg
          className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  );
};
