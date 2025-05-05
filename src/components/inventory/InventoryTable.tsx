import React, { useState, useEffect } from "react";
import {
  Edit,
  FileText,
  Upload,
  Search,
  Plus,
  Grid,
  List,
  AlertTriangle,
} from "lucide-react";
import { InventoryItem } from "../../types/inventory";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { useInventory } from "../../context/InventoryContext";
import { useCategories } from "../../hooks/useCategories";
import { CategoryView } from "./CategoryView";
import { Modal } from "../ui/Modal";
import { ExcelImporter } from "./ExcelImporter";
import { useLocation } from "react-router-dom";

interface InventoryTableProps {
  onEditItem: (item: InventoryItem) => void;
  onAddItem: () => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  onEditItem,
  onAddItem,
}) => {
  const { inventoryItems, loading, fetchInventoryItems } = useInventory();
  const { categories } = useCategories();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Check if we're coming from the dashboard with low stock filter
  useEffect(() => {
    if (location.state && location.state.showLowStockItems) {
      setShowLowStockOnly(true);
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Filter items based on search query, category, and low stock
  const filteredItems = inventoryItems.filter((item) => {
    // Apply search filter
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categories
        .find((c) => c.id === item.categoryId)
        ?.name.toLowerCase()
        .includes(searchQuery.toLowerCase());

    // Apply category filter
    const matchesCategory =
      selectedCategory === "all" || item.categoryId === selectedCategory;

    // Apply low stock filter
    const matchesLowStock = showLowStockOnly
      ? item.quantityAvailable < 5
      : true;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleImportFromExcel = () => {
    setShowImportModal(true);
  };

  const handleImportSuccess = () => {
    fetchInventoryItems();
  };

  const handleExportToExcel = () => {
    // This would be implemented with an Excel generation library
    alert("Export to Excel functionality would be implemented here");
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Search and actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: "all", label: "All Categories" },
                ...categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Filter by category"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant={showLowStockOnly ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              title="Show Low Stock Items Only"
              leftIcon={<AlertTriangle className="h-4 w-4" />}
            >
              Low Stock
            </Button>

            <div className="flex border border-neutral-200 rounded-md">
              <Button
                variant={viewMode === "table" ? "primary" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="rounded-r-none"
                title="Table View"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "primary" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-l-none"
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={handleImportFromExcel}
            className="bg-white"
          >
            Import from Excel
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={onAddItem}
          >
            Add New Item
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-neutral-500">Loading inventory items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center">
          <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-700">
            No items found
          </h3>
          <p className="text-neutral-500 mt-2">
            {searchQuery || selectedCategory !== "all"
              ? "Try adjusting your filters to find what you're looking for."
              : "Add some items to get started."}
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={onAddItem}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add New Item
          </Button>
        </div>
      ) : viewMode === "table" ? (
        // Table View
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Item Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Available
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Reserved
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Total
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={`hover:bg-neutral-50 ${
                    index !== filteredItems.length - 1
                      ? "border-b border-neutral-200"
                      : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-neutral-900">
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-sm text-neutral-500 truncate max-w-xs">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-900">
                      {getCategoryName(item.categoryId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm text-neutral-900">
                      {item.quantityAvailable}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm text-neutral-900">
                      {item.quantityReserved}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-neutral-900">
                      {item.quantityAvailable + item.quantityReserved}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditItem(item)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Grid View (Category View)
        <CategoryView
          items={filteredItems}
          onEditItem={onEditItem}
          selectedCategory={selectedCategory}
        />
      )}

      {/* Import Excel Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Items from Excel"
        size="lg"
      >
        <ExcelImporter
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      </Modal>
    </div>
  );
};
