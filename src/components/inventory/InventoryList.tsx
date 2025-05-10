import React, { useState, useEffect } from "react";
import { Box, Boxes, Search, Filter, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { categories } from "../../data/mockData";

// Define the inventory item type
interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  sku?: string;
  quantityAvailable: number;
  quantityReserved: number;
  unitPrice?: number;
  location?: string;
  imageUrl?: string;
}

interface InventoryListProps {
  onSelectItem?: (item: InventoryItem) => void;
  showSelection?: boolean;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  onSelectItem,
  showSelection = false,
}) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await fetch("/db/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
            categoryId: selectedCategory || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch inventory items");
        }

        const data = await response.json();
        console.log("Received inventory data:", data);
        console.log(
          "First item sample:",
          data.length > 0 ? data[0] : "No items"
        );

        // Send log to server
        fetch("/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "Inventory data received",
            count: data.length,
            sample: data.length > 0 ? data[0] : "No items",
          }),
        }).catch((err) => console.error("Error sending log:", err));
        setInventoryItems(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching inventory:", err);
        setError("Failed to load inventory items. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [selectedCategory]);

  const filteredItems = Array.isArray(inventoryItems)
    ? inventoryItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleSelectItem = (item: InventoryItem) => {
    if (onSelectItem && showSelection) {
      onSelectItem(item);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center">
          <Boxes className="mr-2 h-5 w-5 text-primary-500" />
          Inventory Items
        </CardTitle>

        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
            >
              <option value="">All Categories</option>
              {Array.isArray(categories) &&
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-neutral-500">Loading inventory items...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-error-500 flex flex-col items-center">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <Box className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
            <p>No inventory items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                    Available
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                    Reserved
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                    Price
                  </th>
                  {showSelection && (
                    <th className="px-4 py-3 text-center text-sm font-medium text-neutral-600">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.isArray(filteredItems) &&
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-neutral-200 hover:bg-neutral-50 ${
                        showSelection && item.quantityAvailable > 0
                          ? "cursor-pointer"
                          : ""
                      }`}
                      onClick={() =>
                        showSelection &&
                        item.quantityAvailable > 0 &&
                        handleSelectItem(item)
                      }
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-10 h-10 rounded-md object-cover mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-neutral-200 flex items-center justify-center mr-3">
                              <Box className="h-5 w-5 text-neutral-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-neutral-900">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-sm text-neutral-500 truncate max-w-xs">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {item.categoryName}
                      </td>
                      <td className="px-4 py-4 text-neutral-600 font-mono text-sm">
                        {item.sku || "-"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Badge
                          variant={
                            item.quantityAvailable > 0 ? "success" : "danger"
                          }
                          size="sm"
                        >
                          {item.quantityAvailable}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-neutral-600">
                        {item.quantityReserved > 0 ? (
                          <Badge variant="warning" size="sm">
                            {item.quantityReserved}
                          </Badge>
                        ) : (
                          <span>0</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-neutral-600">
                        {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : "-"}
                      </td>
                      {showSelection && (
                        <td className="px-4 py-4 text-center">
                          <Button
                            variant={
                              item.quantityAvailable > 0 ? "primary" : "ghost"
                            }
                            size="sm"
                            disabled={item.quantityAvailable === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.quantityAvailable > 0) {
                                handleSelectItem(item);
                              }
                            }}
                          >
                            Select
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
