import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { useCategories } from "../../context/CategoryContext";
import { AlertCircle, Check } from "lucide-react";

interface CategoryBulkCreatorProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface BulkResult {
  success: number;
  failed: number;
  errors: string[];
}

export const CategoryBulkCreator: React.FC<CategoryBulkCreatorProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [categories, setCategories] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { createCategory, categories: existingCategories } = useCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Split the input by new lines
      const categoryNames = categories
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (categoryNames.length === 0) {
        setErrorMessage("Please enter at least one category name");
        setIsSubmitting(false);
        return;
      }

      const result: BulkResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      // Process each category
      for (const name of categoryNames) {
        try {
          // Check if category already exists
          const exists = existingCategories.some(
            (c) => c.name.toLowerCase() === name.toLowerCase()
          );

          if (exists) {
            result.failed++;
            result.errors.push(`Category "${name}" already exists`);
            continue;
          }

          // Create the category
          await createCategory({
            name,
            description: `Added via bulk import on ${new Date().toLocaleDateString()}`,
          });

          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push(
            error instanceof Error
              ? `Failed to create "${name}": ${error.message}`
              : `Failed to create "${name}": Unknown error`
          );
        }
      }

      setResult(result);

      if (result.success > 0) {
        onSuccess();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Enter Category Names (one per line)
        </label>
        <Textarea
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          placeholder="Hardware&#10;Software&#10;Office Supplies&#10;Furniture&#10;Cleaning Materials"
          rows={8}
          required
        />
        <p className="mt-1 text-xs text-neutral-500">
          Each line will be created as a separate category
        </p>
      </div>

      {errorMessage && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-error-500 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting || !categories.trim()}
        >
          Create Categories
        </Button>
      </div>
    </form>
  );

  const renderResult = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-primary-50 flex items-center justify-center">
          <Check className="h-8 w-8 text-primary-500" />
        </div>
      </div>

      <h3 className="text-lg font-medium text-center text-neutral-900">
        Categories Created
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
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="button" onClick={onCancel}>
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">{result ? renderResult() : renderForm()}</div>
  );
};
