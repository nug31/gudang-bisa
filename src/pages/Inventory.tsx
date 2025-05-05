import React, { useState } from "react";
import { Package, Tag } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { InventoryListView } from "../components/inventory/InventoryListView";
import { CategoryManagement } from "../components/inventory/CategoryManagement";
import { Button } from "../components/ui/Button";

export const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items");

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
