import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface MockDataNoticeProps {
  onRetry?: () => void;
}

export const MockDataNotice: React.FC<MockDataNoticeProps> = ({ onRetry }) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 flex items-start">
      <AlertTriangle className="text-yellow-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-yellow-700">
          <span className="font-medium">Note:</span> Showing sample data because we couldn't connect to the database.
        </p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="text-xs text-yellow-600 hover:text-yellow-800 underline mt-1"
          >
            Try connecting again
          </button>
        )}
      </div>
    </div>
  );
};
