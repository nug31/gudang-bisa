import React, { useState, useEffect } from "react";
import { Package, Tag, RefreshCw } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { InventoryListView } from "../components/inventory/InventoryListView";
import { CategoryManagement } from "../components/inventory/CategoryManagement";
import { Button } from "../components/ui/Button";
import { useCategories } from "../context/CategoryContext";
import { ErrorDisplay } from "../components/ui/ErrorDisplay";

export const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items");
  const { error, fetchCategories } = useCategories();
  const [showError, setShowError] = useState<boolean>(false);

  // Check for errors and show error message
  useEffect(() => {
    if (error) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  }, [error]);

  const handleRetry = () => {
    console.log("Retrying category fetch...");
    fetchCategories();
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-neutral-900">
            Inventory Management
          </h1>

          <div className="flex space-x-2">
            <Button
              variant={activeTab === "items" ? "primary" : "outline"}
              onClick={() => setActiveTab("items")}
              leftIcon={<Package className="h-4 w-4" />}
            >
              Items
            </Button>
            <Button
              variant={activeTab === "categories" ? "primary" : "outline"}
              onClick={() => setActiveTab("categories")}
              leftIcon={<Tag className="h-4 w-4" />}
            >
              Categories
            </Button>
          </div>
        </div>

        {/* Error display with retry button */}
        {showError && (
          <div className="mb-4">
            <ErrorDisplay
              message={error || "Failed to load data. Please try again."}
              onRetry={handleRetry}
            />
          </div>
        )}

        {activeTab === "items" ? (
          <div className="mt-6">
            <InventoryListView />
          </div>
        ) : (
          <CategoryManagement />
        )}
      </div>
    </Layout>
  );
};
