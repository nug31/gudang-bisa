import React, { forwardRef } from "react";
import { cn } from "../../utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  options: SelectOption[];
  label?: string;
  error?: string;
  helperText?: string;
  onChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, options, label, error, helperText, id, onChange, ...props },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            {label}
          </label>
        )}

        <select
          id={selectId}
          ref={ref}
          className={cn(
            "block w-full rounded-md shadow-3d-sm focus:shadow-3d-md border-neutral-200/50 focus:border-primary-400",
            "bg-white/90 backdrop-blur-sm",
            "transition-all duration-200 transform focus:-translate-y-0.5",
            "focus:ring-0 focus:ring-offset-0",
            error && "border-error-400 focus:border-error-400 shadow-error-100",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={`${selectId}-error ${selectId}-helper`}
          onChange={handleChange}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-error-500">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${selectId}-helper`}
            className="mt-1 text-sm text-neutral-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
