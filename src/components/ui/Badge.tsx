import React from "react";
import { cn } from "../../utils/cn";

type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className,
}) => {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full shadow-3d-sm relative";

  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-neutral-100/90 text-neutral-800 border border-neutral-200/50",
    primary: "bg-primary-100/90 text-primary-800 border border-primary-200/50",
    secondary:
      "bg-secondary-100/90 text-secondary-800 border border-secondary-200/50",
    success: "bg-success-100/90 text-success-800 border border-success-200/50",
    warning: "bg-warning-100/90 text-warning-800 border border-warning-200/50",
    error: "bg-error-100/90 text-error-800 border border-error-200/50",
    info: "bg-blue-100/90 text-blue-800 border border-blue-200/50",
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-sm",
    lg: "px-3 py-1 text-base",
  };

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};
