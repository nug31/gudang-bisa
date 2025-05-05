import React, { useState } from 'react';
import { FileDown, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from './Button';
import { ItemRequest, User } from '../../types';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

interface ExportButtonProps {
  requests: ItemRequest[];
  users: Record<string, User>;
  categories: Record<string, { name: string }>;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  requests, 
  users, 
  categories 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExportToExcel = () => {
    exportToExcel(requests, users, categories);
    setShowDropdown(false);
  };

  const handleExportToPDF = () => {
    exportToPDF(requests, users, categories);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        leftIcon={<FileDown className="h-4 w-4" />}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        Export
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-neutral-200">
          <div className="py-1">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              onClick={handleExportToExcel}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
              Export to Excel
            </button>
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              onClick={handleExportToPDF}
            >
              <FileText className="h-4 w-4 mr-2 text-red-600" />
              Export to PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
