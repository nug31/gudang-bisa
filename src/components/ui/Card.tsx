import React from "react";
import { cn } from "../../utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-3d-sm hover:shadow-3d-md transition-all duration-300 overflow-hidden",
        "transform hover:-translate-y-1 relative card-3d",
        "before:absolute before:inset-0 before:bg-gradient-glass before:opacity-50 before:rounded-xl",
        "border border-secondary-100/70",
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 border-b border-secondary-100/70 relative z-10",
        "bg-gradient-to-r from-white to-secondary-50",
        "backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className,
}) => {
  return (
    <h3 className={cn("text-lg font-semibold text-neutral-900", className)}>
      {children}
    </h3>
  );
};

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({
  children,
  className,
}) => {
  return (
    <p className={cn("text-sm text-neutral-500 mt-1", className)}>{children}</p>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "px-4 sm:px-5 md:px-6 py-4 sm:py-5 relative z-10",
        "backdrop-blur-sm bg-white/95",
        "transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-t border-secondary-100/70",
        className
      )}
    >
      {children}
    </div>
  );
};
