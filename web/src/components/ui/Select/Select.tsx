import React, { useId } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { ErrorWarningIcon } from "@assets/icons/form-icons";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value = "",
  onValueChange,
  options,
  placeholder = "Select an option",
  error,
  helperText,
  disabled = false,
  className = "",
  id: providedId,
}) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  const labelId = `${id}-label`;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const hasError = !!error;
  const hasHelper = !!helperText && !error;
  const ariaDescribedBy = hasError ? errorId : hasHelper ? helperId : undefined;

  return (
    <div className="space-y-2">
      {label && (
        <label
          id={labelId}
          htmlFor={id}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}

      <SelectPrimitive.Root
        value={value === "" ? undefined : value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id}
          aria-labelledby={label ? labelId : undefined}
          aria-describedby={ariaDescribedBy}
          aria-invalid={hasError || undefined}
          type="button"
          className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-slate-900 bg-white border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 data-[placeholder]:text-slate-500 ${
            hasError
              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-primary-200"
          } disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        >
          <SelectPrimitive.Value
            placeholder={placeholder}
            className="min-w-0 flex-1"
          />
          <SelectPrimitive.Icon className="shrink-0 text-slate-500">
            <ChevronDownIcon className="w-4 h-4" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={0}
            align="start"
            className="z-50 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-primary-100 bg-white shadow-lg"
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-3 text-sm text-slate-700 outline-none focus:bg-primary-50 data-[highlighted]:bg-primary-50 data-[disabled]:opacity-50"
                >
                  <SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <CheckIcon className="h-4 w-4 text-accent-600" />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

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
};
