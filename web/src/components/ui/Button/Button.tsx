import React from "react";

/**
 * Base props shared by all button variants
 * @extends React.ButtonHTMLAttributes - Inherits all native button attributes
 */
export interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Content to display inside the button */
  children: React.ReactNode;
}

const baseClasses =
  "font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 relative overflow-hidden group cursor-pointer inline-flex items-center justify-center";

const sizeClasses = {
  sm: "py-2 px-4 text-sm",
  md: "py-3 px-6",
  lg: "py-4 px-8 text-lg",
} as const;

/**
 * Primary button - main call-to-action style
 *
 * @example
 * ```tsx
 * <ButtonPrimary>Click me</ButtonPrimary>
 * <ButtonPrimary size="sm">Small</ButtonPrimary>
 * ```
 */
export interface ButtonPrimaryProps extends BaseButtonProps {
  size?: "sm" | "md" | "lg";
}

export const ButtonPrimary: React.FC<ButtonPrimaryProps> = ({
  size = "md",
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white focus:ring-accent-500 shadow-lg hover:shadow-xl transform hover:-translate-y-px ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-accent-600 to-accent-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

/**
 * Secondary button - alternative action style
 *
 * @example
 * ```tsx
 * <ButtonSecondary>Cancel</ButtonSecondary>
 * <ButtonSecondary size="sm">Small</ButtonSecondary>
 * ```
 */
export interface ButtonSecondaryProps extends BaseButtonProps {
  size?: "sm" | "md" | "lg";
}

export const ButtonSecondary: React.FC<ButtonSecondaryProps> = ({
  size = "md",
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} bg-primary-100 hover:bg-primary-200 text-primary-800 focus:ring-primary-500 border border-primary-200 hover:border-primary-300 ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};

/**
 * Ghost button - subtle style for less prominent actions
 *
 * @example
 * ```tsx
 * <ButtonGhost>Close</ButtonGhost>
 * <ButtonGhost size="sm">Small</ButtonGhost>
 * ```
 */
export interface ButtonGhostProps extends BaseButtonProps {
  size?: "sm" | "md" | "lg";
}

export const ButtonGhost: React.FC<ButtonGhostProps> = ({
  size = "md",
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} bg-transparent hover:bg-primary-50 text-primary-700 focus:ring-primary-500 border border-transparent hover:border-primary-200 ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
};

/**
 * @deprecated Use ButtonPrimary, ButtonSecondary, or ButtonGhost instead
 * Legacy Button component with variant/size props for backwards compatibility
 */
export interface ButtonProps extends BaseButtonProps {
  /** Visual style variant of the button @deprecated Use ButtonPrimary, ButtonSecondary, or ButtonGhost */
  variant?: "primary" | "secondary" | "ghost";
  /** Size variant of the button */
  size?: "sm" | "md" | "lg";
}

/**
 * @deprecated Use ButtonPrimary, ButtonSecondary, or ButtonGhost instead
 * Legacy Button component for backwards compatibility
 */
export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  if (variant === "primary") {
    return (
      <ButtonPrimary size={size} className={className} {...props}>
        {children}
      </ButtonPrimary>
    );
  }

  if (variant === "secondary") {
    return (
      <ButtonSecondary size={size} className={className} {...props}>
        {children}
      </ButtonSecondary>
    );
  }

  return (
    <ButtonGhost size={size} className={className} {...props}>
      {children}
    </ButtonGhost>
  );
};
