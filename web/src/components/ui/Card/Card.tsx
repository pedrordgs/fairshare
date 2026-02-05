import React from "react";

/** Props for the Card container component */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content to display inside the card */
  children: React.ReactNode;
  /** Additional CSS classes */
}

/** Props for the CardHeader sub-component */
export interface CardHeaderProps {
  /** Header content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/** Props for the CardTitle sub-component */
export interface CardTitleProps {
  /** Title content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/** Props for the CardContent sub-component */
export interface CardContentProps {
  /** Content to display (can be any React node) */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Card component for displaying content in a contained, styled box.
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Card content goes here</CardContent>
 * </Card>
 * ```
 */

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-sm border border-primary-100 transition-all duration-300 hover:shadow-md hover:border-primary-200 hover:-translate-y-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = "",
}) => {
  return <div className={`mb-6 ${className}`}>{children}</div>;
};

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = "",
}) => {
  return (
    <h2 className={`text-xl font-semibold text-slate-900 ${className}`}>
      {children}
    </h2>
  );
};

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`text-slate-600 mt-2 leading-relaxed ${className}`}>
      {children}
    </div>
  );
};
