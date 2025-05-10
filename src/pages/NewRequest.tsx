import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { RequestForm } from "../components/requests/RequestForm";
import { Button } from "../components/ui/Button";
import { InventoryItem } from "../types/inventory";
import { safeParseSearchParams } from "../utils/polyfillHelpers";

export const NewRequest: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedItem, setSelectedItem] =
    useState<Partial<InventoryItem> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState<
    { id: string; name: string; quantity: number }[]
  >([]);

  // Get itemId from URL query parameters immediately
  let itemIdFromUrl = null;
  try {
    // First try the standard URLSearchParams
    try {
      const searchParams = new URLSearchParams(location.search);
      itemIdFromUrl = searchParams.get("itemId");
    } catch (urlError) {
      console.warn("URLSearchParams failed, using fallback parser:", urlError);
      // Fallback to our safe parser
      const params = safeParseSearchParams(location.search);
      itemIdFromUrl = params.itemId || null;
    }
  } catch (error) {
    console.error("Error parsing URL search params:", error);
  }

  // Check if we have the item in the location state (passed from BrowseItems)
  const itemFromState = location.state?.selectedItem;
  const cartItemsFromState = location.state?.cartItems;

  // Log the item ID from the URL for debugging
  console.log("Item ID from URL:", itemIdFromUrl);
  console.log("Item from navigation state:", itemFromState);
  console.log("Cart items from navigation state:", cartItemsFromState);

  // Check for cart items in localStorage or state
  useEffect(() => {
    // First check if we have cart items in the location state
    if (cartItemsFromState && cartItemsFromState.length > 0) {
      console.log(
        "Using cart items from navigation state:",
        cartItemsFromState
      );
      setCartItems(cartItemsFromState);

      // Clear the localStorage since we've used the state
      localStorage.removeItem("pendingRequestItems");
    } else {
      // Check if we have cart items in localStorage
      const pendingItemsJson = localStorage.getItem("pendingRequestItems");
      if (pendingItemsJson) {
        try {
          const pendingItems = JSON.parse(pendingItemsJson);
          console.log("Using cart items from localStorage:", pendingItems);
          setCartItems(pendingItems);

          // Clear the localStorage since we've used it
          localStorage.removeItem("pendingRequestItems");
        } catch (e) {
          console.error("Error parsing pending items from localStorage:", e);
        }
      }
    }
  }, [cartItemsFromState]);

  // If we have the item in state, use it immediately
  useEffect(() => {
    if (itemFromState) {
      console.log("Using item from navigation state:", itemFromState);
      setSelectedItem(itemFromState);
    }
  }, [itemFromState]);

  useEffect(() => {
    const fetchInventoryItem = async () => {
      try {
        // Get itemId from URL query parameters
        let itemId = null;
        try {
          // First try the standard URLSearchParams
          try {
            const searchParams = new URLSearchParams(location.search);
            itemId = searchParams.get("itemId");
          } catch (urlError) {
            console.warn(
              "URLSearchParams failed in fetchInventoryItem, using fallback parser:",
              urlError
            );
            // Fallback to our safe parser
            const params = safeParseSearchParams(location.search);
            itemId = params.itemId || null;
          }
        } catch (error) {
          console.error(
            "Error parsing URL search params in fetchInventoryItem:",
            error
          );
          return;
        }

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

          // Try fallback to API endpoint
          try {
            const apiResponse = await fetch("/api/inventory", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "getById",
                id: itemId,
              }),
            });

            if (apiResponse.ok) {
              const item = await apiResponse.json();
              console.log("Fetched item from API fallback:", item);
              setSelectedItem(item);
            }
          } catch (fallbackError) {
            console.error("Error in API fallback:", fallbackError);
          }
        } finally {
          setIsLoading(false);
        }
      } catch (outerError) {
        console.error("Unexpected error in fetchInventoryItem:", outerError);
        setIsLoading(false);
      }
    };

    fetchInventoryItem();
  }, [location.search]);

  const handleBack = () => {
    navigate(-1);
  };

  // Prepare initial data with the selected inventory item or cart items
  let initialData = {};

  try {
    // If we have cart items, prepare them for the form
    if (cartItems && cartItems.length > 0) {
      // Convert cart items to the format expected by RequestForm
      const requestItems = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        available: 100, // This is a placeholder, the actual available quantity will be fetched by the form
      }));

      initialData = {
        requestItems: requestItems,
      };
    }
    // If we have a single selected item
    else if (selectedItem) {
      initialData = {
        category: selectedItem.categoryId,
        inventoryItemId: selectedItem.id,
        inventoryItemName: selectedItem.name,
        inventoryQuantityAvailable: selectedItem.quantityAvailable,
        inventoryQuantityReserved: selectedItem.quantityReserved,
      };
    }
    // If we have an itemId but the item hasn't been fetched yet
    else if (itemIdFromUrl) {
      initialData = {
        inventoryItemId: itemIdFromUrl,
      };
    }
  } catch (error) {
    console.error("Error preparing initialData:", error);
  }

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
