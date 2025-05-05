import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { 
      className, 
      label, 
      error, 
      helperText, 
      id, 
      ...props 
    }, 
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "block w-full rounded-md shadow-sm border-neutral-300 focus:border-primary-400 focus:ring focus:ring-primary-200 focus:ring-opacity-50 transition-colors",
            error && "border-error-400 focus:border-error-400 focus:ring-error-200",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={`${textareaId}-error ${textareaId}-helper`}
          rows={4}
          {...props}
        />
        
        {error && (
          <p 
            id={`${textareaId}-error`}
            className="mt-1 text-sm text-error-500"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            id={`${textareaId}-helper`}
            className="mt-1 text-sm text-neutral-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';