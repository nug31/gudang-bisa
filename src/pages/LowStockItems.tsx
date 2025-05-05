import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { AlertTriangle, Package, ArrowLeft, Search } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { useInventory } from "../context/InventoryContext";
import { useCategories } from "../hooks/useCategories";

export const LowStockItems: React.FC = () => {
  const navigate = useNavigate();
  const { inventoryItems, loading } = useInventory();
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filter for low stock items (quantity < 5)
  const lowStockItems = inventoryItems
    .filter(item => item.quantityAvailable < 5)
    .filter(item => {
      // Apply search filter
      const matchesSearch = searchTerm === "" || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply category filter
      const matchesCategory = selectedCategory === "all" || 
        item.categoryId === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || "Unknown";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="mr-3 p-1 rounded-full hover:bg-neutral-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-neutral-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                Low Stock Items
              </h1>
              <p className="text-neutral-500 mt-1">
                Items that need to be restocked soon
              </p>
            </div>
          </div>

          <Button 
            variant="primary"
            onClick={() => navigate("/inventory")}
          >
            View All Inventory
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search low stock items..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 rounded-full text-sm ${
              selectedCategory === "all"
                ? "bg-primary-100 text-primary-700"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
            onClick={() => setSelectedCategory("all")}
          >
            All Categories
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === category.id
                  ? "bg-primary-100 text-primary-700"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Low stock items list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-neutral-500">Loading inventory items...</p>
          </div>
        ) : lowStockItems.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-yellow-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-neutral-700">No low stock items found</h3>
            <p className="text-neutral-500 mt-1">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search or filters"
                : "All items have sufficient stock levels"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.map(item => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className={`p-3 rounded-md mr-3 ${
                      item.quantityAvailable < 3 
                        ? "bg-red-100" 
                        : "bg-yellow-50"
                    }`}>
                      <Package className={`h-5 w-5 ${
                        item.quantityAvailable < 3 
                          ? "text-red-500" 
                          : "text-yellow-500"
                      }`} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{item.name}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          item.quantityAvailable < 3
                            ? "bg-red-100 text-red-600"
                            : "bg-yellow-100 text-yellow-600"
                        }`}>
                          {item.quantityAvailable < 3 ? "Critical" : "Low"}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">{item.description}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-neutral-500">Category: {getCategoryName(item.categoryId)}</p>
                          <p className="text-xs text-neutral-500 mt-1">Location: {item.location || "Not specified"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{item.quantityAvailable} available</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {item.quantityReserved > 0 ? `${item.quantityReserved} reserved` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
