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
  const filteredItems =
    selectedCategory && selectedCategory !== "all"
      ? items.filter((item) => item.categoryId === selectedCategory)
      : items;

  // Group items by category
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    if (!acc[item.categoryId]) {
      acc[item.categoryId] = [];
    }
    acc[item.categoryId].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // If a specific category is selected, only show that category
  const categoriesToShow =
    selectedCategory && selectedCategory !== "all"
      ? categories.filter((cat) => cat.id === selectedCategory)
      : categories;

  // Create a map of all category IDs that exist in the items
  const categoryIdsInItems = new Set(
    filteredItems.map((item) => item.categoryId)
  );

  // Check if there are items with categories that don't exist in the categories list
  const missingCategories = Array.from(categoryIdsInItems).filter(
    (id) => !categories.some((cat) => cat.id === id)
  );

  // Add missing categories to the list
  const allCategoriesToShow = [...categoriesToShow];

  missingCategories.forEach((id) => {
    // Find an item with this category to get the name
    const itemWithCategory = filteredItems.find(
      (item) => item.categoryId === id
    );
    if (itemWithCategory) {
      allCategoriesToShow.push({
        id,
        name: itemWithCategory.categoryName || "Uncategorized",
        description: "",
      });
    }
  });

  return (
    <div className="space-y-8">
      {allCategoriesToShow.map((category) => {
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
                {categoryItems.map((item) => (
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

      {/* If there are no categories with items, show a message */}
      {allCategoriesToShow.length === 0 && filteredItems.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-neutral-900">
              Uncategorized Items
              <span className="ml-2 text-sm font-normal text-neutral-500">
                ({filteredItems.length}{" "}
                {filteredItems.length === 1 ? "item" : "items"})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
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
      )}
    </div>
  );
};
