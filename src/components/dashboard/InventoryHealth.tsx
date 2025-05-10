import React, { useState } from "react";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  ArrowRight,
} from "lucide-react";
import { Card3D, Card3DContent, Card3DHeader } from "../ui/Card3D";
import { Button } from "../ui/Button";
import { useNavigate } from "react-router-dom";
import { ensureArray, safeMap, safeFilter } from "../../utils/arrayUtils";

interface InventoryHealthProps {
  lowStockCount: number;
  healthPercentage?: number;
  inventoryItems?: any[];
}

export const InventoryHealth: React.FC<InventoryHealthProps> = ({
  lowStockCount,
  healthPercentage = 100,
  inventoryItems = [],
}) => {
  const navigate = useNavigate();
  const [showAllItems, setShowAllItems] = useState(false);

  // Get low stock items with a threshold of 5
  const lowStockThreshold = 5;
  // Use our safe filter utility to handle non-array values
  const lowStockItems = safeFilter(
    inventoryItems,
    (item) => (item.quantityAvailable || 0) < lowStockThreshold
  ).slice(0, showAllItems ? undefined : 3);

  // Fixed trend data for demo
  const trend = "down";
  const trendPercentage = "0.8";

  return (
    <Card3D
      depth="sm"
      className="bg-white hover:shadow-lg transition-all duration-300"
    >
      <Card3DHeader className="bg-warning-50 border-b border-warning-100">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-warning-500" />
          <h3 className="text-lg font-semibold text-warning-800">
            Low Stock Items
          </h3>
        </div>
      </Card3DHeader>

      <Card3DContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-neutral-700">
                Inventory Health
              </p>
              <div className="flex items-center text-xs">
                {trend === "up" ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-success-500 mr-1" />
                    <span className="text-success-600">
                      +{trendPercentage}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-error-500 mr-1" />
                    <span className="text-error-600">-{trendPercentage}%</span>
                  </>
                )}
                <span className="text-neutral-500 ml-1">vs last month</span>
              </div>
            </div>

            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  healthPercentage > 80
                    ? "bg-success-400"
                    : healthPercentage > 50
                    ? "bg-warning-400"
                    : "bg-error-400"
                }`}
                style={{ width: `${healthPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-xs text-neutral-600">
                {healthPercentage}%
              </span>
            </div>
          </div>

          {lowStockCount > 0 ? (
            <>
              <div className="bg-warning-50 p-3 rounded border border-warning-100">
                <p className="text-sm text-warning-800 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-warning-500" />
                  {lowStockCount} {lowStockCount === 1 ? "item" : "items"}{" "}
                  running low on stock. Consider restocking soon.
                </p>
              </div>

              {/* Low stock items list */}
              <div className="space-y-2 mt-3">
                {lowStockItems.length > 0 ? (
                  safeMap(lowStockItems, (item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded border border-neutral-100 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                      onClick={() => navigate(`/inventory/${item.id}`)}
                    >
                      <div className="flex items-center">
                        <div
                          className={`p-2 rounded mr-3 ${
                            item.quantityAvailable < 3
                              ? "bg-error-100"
                              : "bg-warning-50"
                          }`}
                        >
                          <Package
                            className={`h-4 w-4 ${
                              item.quantityAvailable < 3
                                ? "text-error-500"
                                : "text-warning-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <div className="flex items-center mt-1">
                            <p className="text-xs text-neutral-500 mr-2">
                              {item.quantityAvailable} in stock
                            </p>
                            <p className="text-xs text-neutral-500">
                              {item.location}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          item.quantityAvailable < 3
                            ? "bg-error-100 text-error-600"
                            : "bg-warning-100 text-warning-600"
                        }`}
                      >
                        {item.quantityAvailable < 3 ? "Critical" : "Low"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-neutral-500">
                    No low stock items to display
                  </div>
                )}

                {lowStockCount > 3 && !showAllItems && (
                  <button
                    className="w-full text-sm text-primary-600 flex items-center justify-center py-2 hover:underline"
                    onClick={() => setShowAllItems(true)}
                  >
                    Show all {lowStockCount} items
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="bg-success-50 p-4 rounded border border-success-100 text-sm text-success-700 flex items-center">
              <div className="h-3 w-3 rounded-full bg-success-500 mr-2"></div>
              All inventory items have sufficient stock levels.
            </div>
          )}

          <div className="flex justify-end mt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                // Navigate to dedicated low stock items page
                navigate("/inventory/low-stock");

                // Log the action for analytics
                console.log("View All low stock items clicked");
              }}
              className="rounded-full"
              leftIcon={<ArrowRight className="h-4 w-4" />}
            >
              View All
            </Button>
          </div>
        </div>
      </Card3DContent>
    </Card3D>
  );
};
