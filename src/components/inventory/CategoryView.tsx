import React from "react";
import { InventoryItem } from "../../types/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { InventoryItem as InventoryItemComponent } from "./InventoryItem";
import { useCategories } from "../../hooks/useCategories";
import { useAuth } from "../../context/AuthContext";

interface CategoryViewProps {
  items: InventoryItem[];
  onEditItem: (item: InventoryItem) => void;
  selectedCategory?: string;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  items,
  onEditItem,
  selectedCategory,
}) => {
  const { categories } = useCategories();
  const { user } = useAuth();
  const isAdminOrManager = user?.role === "admin" || user?.role === "manager";

  // If a specific category is selected, only show items from that category
  const filteredItems = Array.isArray(items)
    ? selectedCategory && selectedCategory !== "all"
      ? items.filter((item) => {
          // Convert both to strings for comparison
          const itemCategoryIdStr = item.categoryId
            ? String(item.categoryId).trim()
            : "";
          const selectedCategoryStr = String(selectedCategory).trim();

          return (
            item.categoryId === selectedCategory ||
            itemCategoryIdStr === selectedCategoryStr ||
            // Handle UUID format differences
            (itemCategoryIdStr.includes("-") &&
              selectedCategoryStr.includes("-") &&
              itemCategoryIdStr.toLowerCase() ===
                selectedCategoryStr.toLowerCase())
          );
        })
      : items
    : [];

  // Group items by category
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    // Find the matching category
    const matchingCategory = categories.find((category) => {
      const categoryIdStr = String(category.id).trim();
      const itemCategoryIdStr = item.categoryId
        ? String(item.categoryId).trim()
        : "";

      return (
        category.id === item.categoryId ||
        categoryIdStr === itemCategoryIdStr ||
        (categoryIdStr.includes("-") &&
          itemCategoryIdStr.includes("-") &&
          categoryIdStr.toLowerCase() === itemCategoryIdStr.toLowerCase())
      );
    });

    // Use the actual category ID from the categories list if found
    const categoryKey = matchingCategory
      ? matchingCategory.id
      : item.categoryId;

    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // If a specific category is selected, only show that category
  const categoriesToShow =
    selectedCategory && selectedCategory !== "all"
      ? categories.filter((cat) => {
          const catIdStr = String(cat.id).trim();
          const selectedCatStr = String(selectedCategory).trim();

          return (
            cat.id === selectedCategory ||
            catIdStr === selectedCatStr ||
            (catIdStr.includes("-") &&
              selectedCatStr.includes("-") &&
              catIdStr.toLowerCase() === selectedCatStr.toLowerCase())
          );
        })
      : categories;

  return (
    <div className="space-y-8">
      {Array.isArray(categoriesToShow) &&
        categoriesToShow.map((category) => {
          const categoryItems = itemsByCategory[category.id] || [];

          // Skip categories with no items
          if (categoryItems.length === 0) return null;

          return (
            <Card key={category.id} className="animate-fade-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-neutral-900">
                  {category.name}
                  <span className="ml-2 text-sm font-normal text-neutral-500">
                    ({categoryItems.length}{" "}
                    {categoryItems.length === 1 ? "item" : "items"})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.isArray(categoryItems) &&
                    categoryItems.map((item) => (
                      <InventoryItemComponent
                        key={item.id}
                        item={item}
                        onEdit={onEditItem}
                        isAdminOrManager={isAdminOrManager}
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
};
