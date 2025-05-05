import React from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import { Category } from "../../types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useCategories } from "../../hooks/useCategories";
import { useInventory } from "../../context/InventoryContext";

interface CategoryListProps {
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  onAddCategory,
  onEditCategory,
}) => {
  const { categories, loading, error } = useCategories();
  const { inventoryItems } = useInventory();

  // Get count of items in each category
  const getCategoryItemCount = (categoryId: string): number => {
    return inventoryItems.filter((item) => item.categoryId === categoryId)
      .length;
  };

  // Get a color for the category based on its ID
  const getCategoryColor = (id: string): string => {
    const colors = [
      "#3385FF", // vibrant blue - primary
      "#FFEF33", // bright yellow - secondary
      "#FF5C5C", // vibrant red - accent
      "#33C1FF", // bright blue - success
      "#FF3333", // vibrant red - error
      "#0066FF", // darker blue
      "#FFEB00", // darker yellow
    ];

    // Use the sum of character codes to determine the color
    const sum = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  const handleDeleteCategory = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    ) {
      try {
        const response = await fetch("/db/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "delete",
            id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete category");
        }

        // Refresh categories would happen via context
      } catch (err) {
        console.error("Error deleting category:", err);
        alert(
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
        <Button
          onClick={onAddCategory}
          leftIcon={<Plus className="h-4 w-4" />}
          variant="primary"
        >
          Add Category
        </Button>
      </div>

      <p className="text-neutral-600">Manage categories for inventory items</p>

      <div className="grid grid-cols-1 gap-4">
        {categories.map((category) => {
          const itemCount = getCategoryItemCount(category.id);

          return (
            <div
              key={category.id}
              className="border-l-4 rounded-md shadow-sm overflow-hidden bg-white"
              style={{ borderLeftColor: getCategoryColor(category.id) }}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditCategory(category)}
                    className="text-neutral-500 hover:text-neutral-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-error-500 hover:text-error-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
              Add categories to organize your inventory items
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={onAddCategory}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Category
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
