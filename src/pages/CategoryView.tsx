import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { Button } from "../components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { useCategories } from "../context/CategoryContext";
import { useInventory } from "../context/InventoryContext";
import { InventoryItem } from "../types/inventory";
import { CategoryView as CategoryViewComponent } from "../components/inventory/CategoryView";
import { ErrorDisplay } from "../components/ui/ErrorDisplay";

export const CategoryView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    categories,
    loading: categoriesLoading,
    error: categoryError,
  } = useCategories();
  const {
    inventoryItems,
    loading: itemsLoading,
    error: itemsError,
    fetchInventoryItems,
  } = useInventory();
  // We don't need to track selectedCategory as a state variable since we use id from params
  const [categoryItems, setCategoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchInventoryItems(id);
    }
  }, [id, fetchInventoryItems]);

  useEffect(() => {
    if (!categoriesLoading && !itemsLoading) {
      setLoading(false);
      // Filter items by the selected category
      if (id && inventoryItems.length > 0) {
        const filtered = inventoryItems.filter(
          (item) => item.categoryId === id
        );
        setCategoryItems(filtered);
      }
    }
  }, [categoriesLoading, itemsLoading, id, inventoryItems]);

  useEffect(() => {
    if (categoryError || itemsError) {
      setError(categoryError || itemsError);
    } else {
      setError(null);
    }
  }, [categoryError, itemsError]);

  const category = id ? categories.find((c) => c.id === id) : null;

  const handleBack = () => {
    navigate("/inventory");
  };

  const handleEditItem = (item: InventoryItem) => {
    // Implement edit functionality if needed
    console.log("Edit item:", item);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Inventory
            </Button>
          </div>
        </div>

        {error && (
          <ErrorDisplay
            message={error}
            onRetry={() => fetchInventoryItems(id)}
          />
        )}

        {!error && category && (
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              {category.name}
            </h1>
            <p className="text-neutral-600 mb-6">{category.description}</p>

            {categoryItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-neutral-600">
                  No items found in this category.
                </p>
                <Button variant="primary" className="mt-4" onClick={handleBack}>
                  Back to All Categories
                </Button>
              </div>
            ) : (
              <CategoryViewComponent
                items={categoryItems}
                onEditItem={handleEditItem}
                selectedCategory={id || undefined}
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoryView;
