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

  // Get itemId from URL query parameters immediately
  const searchParams = new URLSearchParams(location.search);
  const itemIdFromUrl = searchParams.get("itemId");

  // Check if we have the item in the location state (passed from BrowseItems)
  const itemFromState = location.state?.selectedItem;

  // Log the item ID from the URL for debugging
  console.log("Item ID from URL:", itemIdFromUrl);
  console.log("Item from navigation state:", itemFromState);

  // If we have the item in state, use it immediately
  useEffect(() => {
    if (itemFromState) {
      console.log("Using item from navigation state:", itemFromState);
      setSelectedItem(itemFromState);
    }
  }, [itemFromState]);

  useEffect(() => {
    const fetchInventoryItem = async () => {
      // Get itemId from URL query parameters
      const searchParams = new URLSearchParams(location.search);
      const itemId = searchParams.get("itemId");

      if (!itemId) {
        console.log("No item ID found in URL");
        return;
      }

      console.log("Fetching inventory item with ID:", itemId);

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
        console.log("Fetched item:", item);
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

  // We already have itemIdFromUrl from above

  // Prepare initial data with the selected inventory item
  const initialData = selectedItem
    ? {
        category: selectedItem.categoryId,
        inventoryItemId: selectedItem.id,
        inventoryItemName: selectedItem.name,
        inventoryQuantityAvailable: selectedItem.quantityAvailable,
        inventoryQuantityReserved: selectedItem.quantityReserved,
      }
    : itemIdFromUrl
    ? {
        // If we have an itemId but the item hasn't been fetched yet,
        // at least pass the ID so the form can use it
        inventoryItemId: itemIdFromUrl,
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
