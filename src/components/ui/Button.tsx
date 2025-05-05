import React from "react";
import { cn } from "../../utils/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 focus:outline-none relative overflow-hidden btn-modern";

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-primary-400 text-white hover:bg-primary-500 shadow-3d-button hover:shadow-3d-button-hover active:scale-[0.98] text-shadow-sm",
    secondary:
      "bg-secondary-500 text-white hover:bg-secondary-600 shadow-3d-button hover:shadow-3d-button-hover active:scale-[0.98] text-shadow-sm",
    outline:
      "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 shadow-3d-sm hover:shadow-3d-md active:scale-[0.98]",
    ghost:
      "bg-transparent text-neutral-700 hover:bg-neutral-100 active:scale-[0.98]",
    danger:
      "bg-error-400 text-white hover:bg-error-500 shadow-3d-button hover:shadow-3d-button-hover active:scale-[0.98] text-shadow-sm",
    success:
      "bg-success-600 text-white hover:bg-success-700 shadow-3d-button hover:shadow-3d-button-hover active:scale-[0.98] text-shadow-sm",
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3.5 text-lg",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed hover:bg-opacity-100";

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        (disabled || isLoading) && disabledStyles,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
