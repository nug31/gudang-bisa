import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { RequestForm } from "../components/requests/RequestForm";
import { Button } from "../components/ui/Button";
import { InventoryItem } from "../types/inventory";

export const NewRequest: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedItem, setSelectedItem] =
    useState<Partial<InventoryItem> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInventoryItem = async () => {
      // Get itemId from URL query parameters
      const searchParams = new URLSearchParams(location.search);
      const itemId = searchParams.get("itemId");

      if (!itemId) return;

      try {
        setIsLoading(true);
        const response = await fetch("/db/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getById",
            id: itemId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch inventory item");
        }

        const item = await response.json();
        setSelectedItem(item);
      } catch (error) {
        console.error("Error fetching inventory item:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryItem();
  }, [location.search]);

  const handleBack = () => {
    navigate(-1);
  };

  // Prepare initial data with the selected inventory item
  const initialData = selectedItem
    ? {
        category: selectedItem.categoryId,
        inventoryItemId: selectedItem.id,
        inventoryItemName: selectedItem.name,
        inventoryQuantityAvailable: selectedItem.quantityAvailable,
        inventoryQuantityReserved: selectedItem.quantityReserved,
      }
    : {};

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={handleBack}
          >
            Back
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <RequestForm initialData={initialData} />
        )}
      </div>
    </Layout>
  );
};
