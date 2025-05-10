import React, { useState } from "react";
import {
  Edit,
  Trash2,
  AlertTriangle,
  Package,
  Plus,
  Minus,
} from "lucide-react";
import { InventoryItem as InventoryItemType } from "../../types/inventory";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { formatCurrency } from "../../utils/formatters";
import { useInventory } from "../../context/InventoryContext";
import { useAuth } from "../../context/AuthContext";
import { isAdminOrManager } from "../../utils/permissions";

interface InventoryItemProps {
  item: InventoryItemType;
  onEdit: (item: InventoryItemType) => void;
  isAdminOrManager?: boolean;
}

export const InventoryItem: React.FC<InventoryItemProps> = ({
  item,
  onEdit,
  isAdminOrManager,
}) => {
  const { updateInventoryItem, deleteInventoryItem } = useInventory();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
  const { user } = useAuth();

  const handleDelete = async () => {
    // Check if user has permission to delete
    if (!(isAdminOrManager || isAdminOrManager(user?.role))) {
      alert("Only administrators and managers can delete inventory items");
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      setIsDeleting(true);
      try {
        await deleteInventoryItem(item.id);
      } catch (error) {
        console.error("Error deleting item:", error);
        alert(error instanceof Error ? error.message : "Failed to delete item");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleIncreaseQuantity = async () => {
    setIsUpdatingQuantity(true);
    try {
      await updateInventoryItem({
        id: item.id,
        quantityAvailable: item.quantityAvailable + 1,
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setIsUpdatingQuantity(false);
    }
  };

  const handleDecreaseQuantity = async () => {
    if (item.quantityAvailable <= 0) return;

    setIsUpdatingQuantity(true);
    try {
      await updateInventoryItem({
        id: item.id,
        quantityAvailable: item.quantityAvailable - 1,
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setIsUpdatingQuantity(false);
    }
  };

  const getStockStatusBadge = () => {
    if (item.quantityAvailable === 0) {
      return <Badge variant="danger">Out of Stock</Badge>;
    } else if (item.quantityAvailable <= 5) {
      return <Badge variant="warning">Low Stock</Badge>;
    } else {
      return <Badge variant="success">In Stock</Badge>;
    }
  };

  return (
    <Card className="h-full transition-all hover:shadow-lg animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-neutral-900">
                {item.name}
              </h3>
              <div className="ml-2">{getStockStatusBadge()}</div>
            </div>
            <p className="text-sm text-neutral-500 mt-1">{item.categoryName}</p>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              title="Edit Item"
            >
              <Edit className="h-4 w-4 text-neutral-500" />
            </Button>

            {(isAdminOrManager || isAdminOrManager(user?.role)) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
                title="Delete Item"
              >
                <Trash2 className="h-4 w-4 text-error-500" />
              </Button>
            )}
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-neutral-700 mt-3 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-500">Available</p>
            <div className="flex items-center mt-1">
              <Button
                variant="outline"
                size="xs"
                onClick={handleDecreaseQuantity}
                disabled={item.quantityAvailable <= 0 || isUpdatingQuantity}
                className="p-1"
              >
                <Minus className="h-3 w-3" />
              </Button>

              <span className="mx-2 font-medium">{item.quantityAvailable}</span>

              <Button
                variant="outline"
                size="xs"
                onClick={handleIncreaseQuantity}
                disabled={isUpdatingQuantity}
                className="p-1"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs text-neutral-500">Reserved</p>
            <p className="font-medium mt-1">{item.quantityReserved}</p>
          </div>
        </div>

        {item.sku && (
          <div className="mt-4">
            <p className="text-xs text-neutral-500">SKU</p>
            <p className="text-sm font-medium mt-1">{item.sku}</p>
          </div>
        )}

        {item.location && (
          <div className="mt-4">
            <p className="text-xs text-neutral-500">Location</p>
            <p className="text-sm font-medium mt-1">{item.location}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
