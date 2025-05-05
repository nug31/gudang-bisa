import React, { useState, useRef } from "react";
import { Upload, X, Check, AlertCircle, FileText, Plus } from "lucide-react";
import { Button } from "../ui/Button";
import { useInventory } from "../../context/InventoryContext";
import { InventoryItem } from "../../types/inventory";
import { useCategories } from "../../context/CategoryContext";
import * as XLSX from "xlsx";
import { Modal } from "../ui/Modal";
import { CategoryBulkCreator } from "./CategoryBulkCreator";

interface ExcelImporterProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [hasCategoryError, setHasCategoryError] = useState(false);

  const { createInventoryItem } = useInventory();
  const { categories, fetchCategories } = useCategories();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setErrorMessage(null);

    if (!selectedFile) {
      return;
    }

    // Check file type
    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (
      fileExtension !== "xlsx" &&
      fileExtension !== "xls" &&
      fileExtension !== "csv"
    ) {
      setErrorMessage(
        "Please upload a valid Excel or CSV file (.xlsx, .xls, .csv)"
      );
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    parseExcelFile(selectedFile);
  };

  const parseExcelFile = async (file: File) => {
    setIsProcessing(true);

    try {
      const data = await readExcelFile(file);

      // Validate data structure
      if (!data || !data.length) {
        throw new Error("The file contains no data");
      }

      // Check if the file has the required columns
      const requiredColumns = ["name", "categoryId", "quantityAvailable"];
      const firstRow = data[0];

      const missingColumns = requiredColumns.filter(
        (col) =>
          !Object.keys(firstRow).some(
            (key) => key.toLowerCase() === col.toLowerCase()
          )
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Missing required columns: ${missingColumns.join(", ")}`
        );
      }

      // Set preview data (first 5 rows)
      setPreviewData(data.slice(0, 5));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to parse Excel file"
      );
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Failed to read file"));
            return;
          }

          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsBinaryString(file);
    });
  };

  const handleImport = async () => {
    if (!file) {
      setErrorMessage("Please select a file to import");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const data = await readExcelFile(file);

      const result: ImportResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      // Process each row
      for (const row of data) {
        try {
          // Map Excel columns to inventory item properties
          const item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt"> = {
            name: row.name || row.Name || "",
            description: row.description || row.Description || "",
            categoryId: row.categoryId || row.CategoryId || "",
            categoryName: "", // Will be set based on categoryId
            quantityAvailable: parseInt(
              row.quantityAvailable || row.QuantityAvailable || 0,
              10
            ),
            quantityReserved: parseInt(
              row.quantityReserved || row.QuantityReserved || 0,
              10
            ),
            sku: row.sku || row.SKU || "",
            location: row.location || row.Location || "",
            imageUrl: row.imageUrl || row.ImageUrl || "",
          };

          // Validate required fields
          if (!item.name) {
            throw new Error(
              `Row ${result.success + result.failed + 1}: Name is required`
            );
          }

          if (!item.categoryId) {
            throw new Error(
              `Row ${
                result.success + result.failed + 1
              }: Category ID is required`
            );
          }

          // Try to find the category by ID
          let category = categories.find((c) => c.id === item.categoryId);

          // If not found, try to find by numeric index (for simple templates)
          if (!category) {
            const numericId = parseInt(item.categoryId, 10);
            if (
              !isNaN(numericId) &&
              numericId > 0 &&
              numericId <= categories.length
            ) {
              category = categories[numericId - 1]; // Use 1-based indexing
            }
          }

          // If still not found, use the first category
          if (!category && categories.length > 0) {
            category = categories[0];
            console.log(
              `Row ${
                result.success + result.failed + 1
              }: Using default category '${category.name}' for item '${
                item.name
              }'`
            );
          } else if (!category) {
            // Get a list of valid categories to show in the error message
            const validCategories = categories
              .map((c) => `${c.name} (ID: ${c.id})`)
              .join(", ");
            throw new Error(
              `Row ${
                result.success + result.failed + 1
              }: No valid categories found in the system. Valid categories are: ${
                validCategories || "None"
              }`
            );
          }

          // Set category ID and name
          item.categoryId = category.id;
          item.categoryName = category.name;

          // Create inventory item
          console.log(
            `Creating inventory item: ${item.name} in category ${item.categoryId}`
          );
          try {
            const createdItem = await createInventoryItem(item);
            console.log(
              `Successfully created item: ${createdItem.name} with ID: ${createdItem.id}`
            );
            result.success++;
          } catch (createError) {
            console.error(`Error creating item ${item.name}:`, createError);
            throw createError;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(
            error instanceof Error
              ? error.message
              : `Row ${result.success + result.failed}: Unknown error`
          );
        }
      }

      // Check if there are category-related errors
      const hasCategoryErrors = result.errors.some((error) =>
        error.includes("No valid categories found")
      );

      setHasCategoryError(hasCategoryErrors);
      setResult(result);

      if (result.success > 0) {
        onSuccess();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to import data"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Check file type
      const fileExtension = droppedFile.name.split(".").pop()?.toLowerCase();
      if (
        fileExtension !== "xlsx" &&
        fileExtension !== "xls" &&
        fileExtension !== "csv"
      ) {
        setErrorMessage(
          "Please upload a valid Excel or CSV file (.xlsx, .xls, .csv)"
        );
        return;
      }

      setFile(droppedFile);
      parseExcelFile(droppedFile);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const renderUploadArea = () => (
    <div
      className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center cursor-pointer hover:bg-neutral-50 transition-colors"
      onClick={handleClickUpload}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-50">
        <Upload className="h-6 w-6 text-primary-500" />
      </div>

      <h3 className="mt-4 text-lg font-medium text-neutral-900">
        Upload Excel File
      </h3>

      <p className="mt-2 text-sm text-neutral-500">
        Drag and drop your Excel file here, or click to browse
      </p>

      <p className="mt-1 text-xs text-neutral-400">
        Supported formats: .xlsx, .xls, .csv
      </p>

      <div className="flex flex-col items-center mt-4 space-y-2">
        <Button variant="outline" leftIcon={<FileText className="h-4 w-4" />}>
          Select File
        </Button>

        <a
          href="/simple_inventory_template.xlsx"
          download
          className="text-xs text-primary-600 hover:text-primary-800 underline"
        >
          Download simple template file
        </a>
      </div>
    </div>
  );

  const renderFilePreview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded bg-primary-50 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-900">{file?.name}</p>
            <p className="text-xs text-neutral-500">
              {file ? `${(file.size / 1024).toFixed(2)} KB` : ""}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFile(null);
            setPreviewData([]);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          className="text-neutral-500"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {previewData.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-neutral-900 mb-2">
            Preview (first 5 rows):
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 border border-neutral-200 rounded-md">
              <thead className="bg-neutral-50">
                <tr>
                  {Object.keys(previewData[0]).map((key) => (
                    <th
                      key={key}
                      className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value: any, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-3 py-2 text-xs text-neutral-900 truncate max-w-xs"
                      >
                        {value?.toString() || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const handleCategorySuccess = async () => {
    setShowCategoryModal(false);
    await fetchCategories();
    setHasCategoryError(false);
  };

  const renderResult = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-primary-50 flex items-center justify-center">
          <Check className="h-8 w-8 text-primary-500" />
        </div>
      </div>

      <h3 className="text-lg font-medium text-center text-neutral-900">
        Import Complete
      </h3>

      <div className="flex justify-center space-x-8">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary-500">
            {result?.success}
          </p>
          <p className="text-sm text-neutral-500">Successful</p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold text-error-500">{result?.failed}</p>
          <p className="text-sm text-neutral-500">Failed</p>
        </div>
      </div>

      {result?.errors.length ? (
        <div className="mt-4 bg-error-50 border border-error-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-error-700 mb-2">Errors:</h4>
          <ul className="text-xs text-error-600 list-disc pl-5 space-y-1">
            {result.errors.slice(0, 5).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
            {result.errors.length > 5 && (
              <li>...and {result.errors.length - 5} more errors</li>
            )}
          </ul>

          {hasCategoryError && (
            <div className="mt-3 pt-3 border-t border-error-200">
              <p className="text-sm text-error-700 mb-2">
                Missing categories detected. Would you like to add them now?
              </p>
              <Button
                size="sm"
                onClick={() => setShowCategoryModal(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Categories
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex justify-end mt-4">
        <Button type="button" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-error-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm">{errorMessage}</p>
            {errorMessage.includes("Missing required columns") && (
              <p className="text-xs mt-1">
                Please use the{" "}
                <a
                  href="/simple_inventory_template.xlsx"
                  download
                  className="underline"
                >
                  simple template file
                </a>{" "}
                to ensure all required columns are included.
              </p>
            )}
            {errorMessage.includes("No valid categories found") && (
              <p className="text-xs mt-1">
                Please add the required categories to the system first, or
                update your Excel file to use valid category IDs.
              </p>
            )}
          </div>
        </div>
      )}

      {result ? (
        renderResult()
      ) : (
        <>
          {file ? renderFilePreview() : renderUploadArea()}

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>

            {file && !result && (
              <Button
                variant="primary"
                onClick={handleImport}
                isLoading={isUploading}
                disabled={isProcessing}
                leftIcon={<Upload className="h-4 w-4" />}
              >
                Import Data
              </Button>
            )}
          </div>
        </>
      )}

      {/* Category Creator Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Add Categories"
        size="md"
      >
        <CategoryBulkCreator
          onSuccess={handleCategorySuccess}
          onCancel={() => setShowCategoryModal(false)}
        />
      </Modal>
    </div>
  );
};
