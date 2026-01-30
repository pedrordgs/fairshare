import React, { forwardRef, useId } from "react";
import { ErrorWarningIcon } from "@assets/icons/form-icons";

/**
 * Props for the Input component
 * @extends React.InputHTMLAttributes - Inherits all native input attributes
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  /** Error message to display (takes precedence over helperText) */
  error?: string;
  /** Helper text displayed below the input (hidden when error is present) */
  helperText?: string;
}

/**
 * Input component with label, error handling, and accessibility features.
 *
 * Features:
 * - Auto-generated unique IDs for accessibility
 * - Error state with visual feedback
 * - Helper text support
 * - Proper ARIA attributes (aria-invalid, aria-describedby)
 * - Ref forwarding for form integration
 *
 * @example
 * ```tsx
 * <Input label="Email" type="email" error={errors.email} />
 * <Input label="Password" type="password" helperText="Must be at least 6 characters" />
 * ```
 */

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, className = "", id: providedId, ...props },
    ref,
  ) => {
    // Generate a unique ID if not provided
    const generatedId = useId();
    const id = providedId || generatedId;

    // Generate IDs for error and helper text
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    // Determine which description to use
    const hasError = !!error;
    const hasHelper = !!helperText && !error;
    const ariaDescribedBy = hasError
      ? errorId
      : hasHelper
        ? helperId
        : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={id}
          className={`
            w-full px-4 py-3 text-slate-900 placeholder-slate-500
            border border-primary-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500
            transition-all duration-200
            ${error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""}
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={ariaDescribedBy}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            className="text-sm text-red-600 flex items-center gap-1"
            role="alert"
          >
            <ErrorWarningIcon className="w-4 h-4" />
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="text-sm text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
