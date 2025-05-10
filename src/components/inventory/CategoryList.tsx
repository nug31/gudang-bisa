import React, { useState } from "react";
import { Edit, Trash2, Plus, AlertTriangle } from "lucide-react";
import { Category } from "../../types";
import { Button } from "../ui/Button";
import { useCategories } from "../../context/CategoryContext";
import { useInventory } from "../../context/InventoryContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface CategoryListProps {
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  onAddCategory,
  onEditCategory,
}) => {
  const { categories, loading, error, deleteCategory } = useCategories();
  const { inventoryItems } = useInventory();
  const { user } = useAuth();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Safely check user role - only evaluate the second condition if user exists
  const isAdminOrManager = user
    ? user.role === "admin" || user.role === "manager"
    : false;

  // Get count of items in each category
  const getCategoryItemCount = (categoryId: string | number): number => {
    console.log(`Counting items for category ID: ${categoryId}`);

    // Convert both to strings for comparison to handle different ID formats
    const categoryIdStr = String(categoryId).trim();

    return inventoryItems.filter((item) => {
      // Convert item categoryId to string for comparison
      const itemCategoryIdStr = item.categoryId
        ? String(item.categoryId).trim()
        : "";

      // Check for exact match or string match
      const isMatch =
        item.categoryId === categoryId ||
        itemCategoryIdStr === categoryIdStr ||
        // Handle UUID format differences
        (itemCategoryIdStr.includes("-") &&
          categoryIdStr.includes("-") &&
          itemCategoryIdStr.toLowerCase() === categoryIdStr.toLowerCase());

      if (isMatch) {
        console.log(
          `Found match: Item ${item.name} with categoryId ${item.categoryId}`
        );
      }

      return isMatch;
    }).length;
  };

  // Get a color for the category based on its ID
  const getCategoryColor = (id: string | number) => {
    const colors = [
      "#FF3333", // vibrant red - error
      "#0066FF", // darker blue
      "#FFEB00", // darker yellow
    ];

    // Convert id to string if it isn't already
    const idStr = String(id);

    // Use the sum of character codes to determine the color
    const sum = idStr
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!isAdminOrManager) {
      alert("Only administrators and managers can delete categories");
      return;
    }

    // Check if category has items
    const itemCount = getCategoryItemCount(id);
    if (itemCount > 0) {
      setDeleteError(
        `Cannot delete category "${name}" because it contains ${itemCount} items. Move or delete these items first.`
      );
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete category "${name}"? This action cannot be undone.`
      )
    ) {
      setDeleteError(null);
      try {
        const success = await deleteCategory(id);

        if (!success) {
          setDeleteError(
            `Failed to delete category "${name}". Please try again.`
          );
        }
      } catch (err) {
        console.error("Error deleting category:", err);
        setDeleteError(
          err instanceof Error
            ? err.message
            : "An error occurred while deleting the category"
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-neutral-500">Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-neutral-900">
          Category Management
        </h2>
        {isAdminOrManager && (
          <Button
            onClick={onAddCategory}
            leftIcon={<Plus className="h-4 w-4" />}
            variant="primary"
          >
            Add Category
          </Button>
        )}
      </div>

      <p className="text-neutral-600">Manage categories for inventory items</p>

      {/* Delete error display */}
      {deleteError && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-error-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{deleteError}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  className="inline-flex rounded-md p-1.5 text-error-500 hover:bg-error-100 focus:outline-none focus:ring-2 focus:ring-error-600 focus:ring-offset-2 focus:ring-offset-error-50"
                  onClick={() => setDeleteError(null)}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {categories.map((category) => {
          const itemCount = getCategoryItemCount(category.id);

          return (
            <div
              key={category.id}
              className="border-l-4 rounded-md shadow-sm overflow-hidden bg-white cursor-pointer transition-shadow hover:shadow-md"
              style={{ borderLeftColor: getCategoryColor(category.id) }}
              onClick={() => navigate(`/inventory/category/${category.id}`)}
            >
              <div className="p-4 flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-neutral-900">
                    {category.name}
                  </h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    {category.description || "No description"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex space-x-1">
                  {isAdminOrManager && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent navigation to category view
                          onEditCategory(category);
                        }}
                        className="text-neutral-500 hover:text-neutral-700"
                        title="Edit Category"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent navigation to category view
                          handleDeleteCategory(category.id, category.name);
                        }}
                        className="text-error-500 hover:text-error-700"
                        title="Delete Category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-700">
              No categories yet
            </h3>
            <p className="text-neutral-500 mt-2">
              {isAdminOrManager
                ? "Add categories to organize your inventory items"
                : "No categories available. Contact an administrator to add categories."}
            </p>
            {isAdminOrManager && (
              <Button
                variant="primary"
                className="mt-4"
                onClick={onAddCategory}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Category
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
