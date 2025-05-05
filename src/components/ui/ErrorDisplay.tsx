import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start">
      <AlertCircle className="h-5 w-5 text-error-500 mr-3 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-medium text-error-800">Error</h3>
        <p className="text-error-700 mt-1">{message}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-800"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};
