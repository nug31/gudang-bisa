import React from "react";
import { InventoryItem } from "../../types/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { InventoryItem as InventoryItemComponent } from "./InventoryItem";
import { useCategories } from "../../hooks";
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

  return (
    <div className="space-y-8">
      {categoriesToShow.map((category) => {
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
    </div>
  );
};
