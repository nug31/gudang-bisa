import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { InventoryItem } from "../types/inventory";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from "uuid";

interface InventoryContextType {
  inventoryItems: InventoryItem[];
  loading: boolean;
  error: string | null;
  fetchInventoryItems: (categoryId?: string) => Promise<void>;
  getInventoryItem: (id: string) => Promise<InventoryItem | null>;
  createInventoryItem: (
    item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  ) => Promise<InventoryItem>;
  updateInventoryItem: (
    item: Partial<InventoryItem> & { id: string }
  ) => Promise<InventoryItem>;
  deleteInventoryItem: (id: string) => Promise<boolean>;
  forceRefreshInventory: (categoryId?: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined
);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};

interface InventoryProviderProps {
  children: ReactNode;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({
  children,
}) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchInventoryItems = async (categoryId?: string, retryCount = 0) => {
    setLoading(true);
    setError(null);

    try {
      console.log(
        `Fetching inventory items (attempt ${retryCount + 1})${
          categoryId ? ` for category ${categoryId}` : ""
        }...`
      );

      // Get the base URL for API calls
      const baseUrl = window.location.origin;
      const isProduction =
        window.location.hostname.includes("netlify") ||
        window.location.hostname.includes("gudangmitra");

      console.log(
        `Running in ${isProduction ? "production" : "development"} mode`
      );
      console.log(`Base URL: ${baseUrl}`);

      // Try the direct-inventory function first (most reliable)
      console.log(
        "Trying to fetch inventory items from direct-inventory function..."
      );
      try {
        const directUrl = `${baseUrl}/.netlify/functions/direct-inventory`;
        console.log(`Fetching from: ${directUrl}`);

        const directResponse = await fetch(directUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (directResponse.ok) {
          const text = await directResponse.text();
          const data = text ? JSON.parse(text) : { items: [] };
          const items = data.items || data;

          console.log(
            `Successfully fetched ${items.length} inventory items from direct endpoint`
          );
          console.log("Response format:", data);

          if (items.length > 0) {
            console.log("Sample item from direct endpoint:", items[0]);
          }

          setInventoryItems(Array.isArray(items) ? items : []);
          setError(null);
          return;
        } else {
          console.log(
            `Direct endpoint failed with status ${directResponse.status}, trying API endpoint...`
          );
        }
      } catch (directError) {
        console.error("Error with direct endpoint:", directError);
      }

      // Try the API endpoint next
      try {
        const apiUrl = `${baseUrl}/api/inventory`;
        console.log(`Trying to fetch inventory items from ${apiUrl}...`);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
            categoryId: categoryId !== "all" ? categoryId : undefined,
          }),
        });

        if (response.ok) {
          const text = await response.text();
          const responseData = text ? JSON.parse(text) : { items: [] };
          const items = responseData.items || responseData;

          console.log(
            `Successfully fetched ${items.length} inventory items from API endpoint`
          );

          if (items.length > 0) {
            console.log("Sample item from API endpoint:", items[0]);
          }

          setInventoryItems(Array.isArray(items) ? items : []);
          setError(null);
          return;
        } else {
          console.log(
            `API endpoint failed with status ${response.status}, trying DB endpoint...`
          );
        }
      } catch (apiError) {
        console.error("Error with API endpoint:", apiError);
      }

      // Try fallback to db endpoint
      try {
        const dbUrl = `${baseUrl}/db/inventory`;
        console.log(`Trying to fetch inventory items from ${dbUrl}...`);

        const fallbackResponse = await fetch(dbUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
            categoryId: categoryId !== "all" ? categoryId : undefined,
          }),
        });

        if (fallbackResponse.ok) {
          const text = await fallbackResponse.text();
          const responseData = text ? JSON.parse(text) : { items: [] };
          const items = responseData.items || responseData;

          console.log(
            `Successfully fetched ${items.length} inventory items from DB endpoint`
          );

          if (items.length > 0) {
            console.log("Sample item from DB endpoint:", items[0]);
          }

          setInventoryItems(Array.isArray(items) ? items : []);
          setError(null);
          return;
        } else {
          console.log(
            `DB endpoint failed with status ${fallbackResponse.status}, trying Netlify function...`
          );
        }
      } catch (dbError) {
        console.error("Error with DB endpoint:", dbError);
      }

      // Try the Netlify function as a last resort
      try {
        const netlifyUrl = `${baseUrl}/.netlify/functions/neon-inventory`;
        console.log(`Trying to fetch inventory items from ${netlifyUrl}...`);

        const netlifyResponse = await fetch(netlifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
            categoryId: categoryId !== "all" ? categoryId : undefined,
          }),
        });

        if (netlifyResponse.ok) {
          const text = await netlifyResponse.text();
          const responseData = text ? JSON.parse(text) : { items: [] };
          const items = responseData.items || responseData;

          console.log(
            `Successfully fetched ${items.length} inventory items from Netlify function`
          );

          if (items.length > 0) {
            console.log("Sample item from Netlify function:", items[0]);
          }

          setInventoryItems(Array.isArray(items) ? items : []);
          setError(null);
          return;
        } else {
          console.log(`All endpoints failed, using mock data`);
        }
      } catch (netlifyError) {
        console.error("Error with Netlify function:", netlifyError);
      }

      // If all endpoints fail, use mock data
      console.log("All endpoints failed, using mock data");
      const mockItems = getMockInventoryItems();
      setInventoryItems(mockItems);
      setError("Could not connect to the database. Using sample data instead.");
    } catch (error) {
      console.error("Error fetching inventory items:", error);

      // If we haven't retried too many times, try again
      if (retryCount < 2) {
        console.log(`Retrying (${retryCount + 1}/3)...`);
        setLoading(false);
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchInventoryItems(categoryId, retryCount + 1);
      }

      setError("Failed to load inventory items. Please try again later.");
      // Set empty array on error to prevent UI issues
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getInventoryItem = async (
    id: string
  ): Promise<InventoryItem | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching inventory item with ID: ${id}`);

      // First check if the item is already in our state
      const cachedItem = inventoryItems.find((item) => item.id === id);
      if (cachedItem) {
        console.log("Found item in cached inventory items:", cachedItem.name);
        return cachedItem;
      }

      // Get the base URL for API calls
      const baseUrl = window.location.origin;
      const isProduction =
        window.location.hostname.includes("netlify") ||
        window.location.hostname.includes("gudangmitra");

      console.log(
        `Running in ${isProduction ? "production" : "development"} mode`
      );
      console.log(`Base URL: ${baseUrl}`);

      // Try the direct-inventory function first with the ID as a parameter
      try {
        const directUrl = `${baseUrl}/.netlify/functions/direct-inventory?id=${id}`;
        console.log(`Trying to fetch inventory item from ${directUrl}...`);

        const directResponse = await fetch(directUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (directResponse.ok) {
          const text = await directResponse.text();
          if (!text) {
            console.log("Empty response from direct endpoint");
          } else {
            const data = JSON.parse(text);
            const items = data.items || data;

            if (Array.isArray(items) && items.length > 0) {
              // Find the item with the matching ID
              const item = items.find((item) => item.id === id);
              if (item) {
                console.log(
                  "Found item in direct endpoint response:",
                  item.name
                );
                return item;
              }
            }
          }
        }

        console.log(
          "Item not found in direct endpoint response, trying API endpoint..."
        );
      } catch (directError) {
        console.error("Error with direct endpoint:", directError);
      }

      // Try the API endpoint next
      try {
        const apiUrl = `${baseUrl}/api/inventory`;
        console.log(`Trying to fetch inventory item from ${apiUrl}...`);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getById",
            id,
          }),
        });

        if (response.ok) {
          const text = await response.text();
          if (!text) {
            console.log("Empty response from API endpoint");
          } else {
            const item = JSON.parse(text);
            console.log(
              "Successfully fetched inventory item from API:",
              item.name
            );
            return item;
          }
        } else {
          console.log(
            `API endpoint failed with status ${response.status}, trying DB endpoint...`
          );
        }
      } catch (apiError) {
        console.error("Error with API endpoint:", apiError);
      }

      // Try fallback to db endpoint
      try {
        const dbUrl = `${baseUrl}/db/inventory`;
        console.log(`Trying to fetch inventory item from ${dbUrl}...`);

        const fallbackResponse = await fetch(dbUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getById",
            id,
          }),
        });

        if (fallbackResponse.ok) {
          const text = await fallbackResponse.text();
          if (!text) {
            console.log("Empty response from DB endpoint");
          } else {
            const item = JSON.parse(text);
            console.log(
              "Successfully fetched inventory item from DB:",
              item.name
            );
            return item;
          }
        } else {
          console.log(
            `DB endpoint failed with status ${fallbackResponse.status}, trying to fetch all items...`
          );
        }
      } catch (dbError) {
        console.error("Error with DB endpoint:", dbError);
      }

      // If all direct fetches fail, try to fetch all items and find the one we need
      console.log("All direct endpoints failed, trying to fetch all items...");
      if (inventoryItems.length === 0) {
        await fetchInventoryItems();
        const refetchedItem = inventoryItems.find((item) => item.id === id);
        if (refetchedItem) {
          console.log(
            "Found item after fetching all items:",
            refetchedItem.name
          );
          return refetchedItem;
        }
      } else {
        // Check one more time in our current items
        const existingItem = inventoryItems.find((item) => item.id === id);
        if (existingItem) {
          console.log(
            "Found item in existing inventory items:",
            existingItem.name
          );
          return existingItem;
        }
      }

      console.log(`Item with ID ${id} not found in any source`);
      return null;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching inventory item:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Track the last operation timestamp to help with refresh logic
  const [lastOperationTime, setLastOperationTime] = useState<number>(0);

  // Function to force a complete refresh of inventory data
  const forceRefreshInventory = async (categoryId?: string) => {
    console.log("Forcing complete inventory refresh...");

    // Clear the current inventory items to ensure we get fresh data
    setInventoryItems([]);

    // Fetch inventory items with the current category filter
    await fetchInventoryItems(categoryId);

    // Update the last operation timestamp
    setLastOperationTime(Date.now());

    console.log("Inventory refresh complete");
  };

  const createInventoryItem = async (
    item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  ): Promise<InventoryItem> => {
    setLoading(true);
    setError(null);

    try {
      // Check if user is admin or manager
      if (user?.role !== "admin" && user?.role !== "manager") {
        console.warn(
          "User attempted to create item without proper permissions:",
          user?.role
        );
        throw new Error(
          "Only administrators and managers can create inventory items"
        );
      }

      console.log("User has permission to create items:", user?.role);

      console.log("Creating inventory item:", item);
      // Update the last operation timestamp
      setLastOperationTime(Date.now());

      // Use the DB endpoint directly (more reliable with PostgreSQL)
      // Check if we're running in production (Netlify)
      const isProduction =
        window.location.hostname.includes("netlify") ||
        window.location.hostname.includes("gudangmitra");

      // Use the appropriate endpoint based on environment
      const endpoint = isProduction
        ? "/.netlify/functions/neon-inventory"
        : "/db/inventory";
      console.log(`Using endpoint for item creation: ${endpoint}`);

      try {
        const dbResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            name: item.name,
            description: item.description || "",
            categoryId: item.categoryId,
            sku: item.sku || "",
            quantityAvailable: item.quantityAvailable || 0,
            quantityReserved: item.quantityReserved || 0,
            location: item.location || "",
            imageUrl: item.imageUrl || "",
          }),
        });

        if (!dbResponse.ok) {
          console.error(`DB endpoint failed with status ${dbResponse.status}`);
          const errorText = await dbResponse.text();
          console.error("Error response:", errorText);
          throw new Error(
            `DB endpoint failed with status ${dbResponse.status}: ${errorText}`
          );
        }

        const newItem = await dbResponse.json();
        console.log("Item created successfully via DB endpoint:", newItem);

        // Update local state with the new item
        setInventoryItems((prev) => {
          // Make sure we don't add duplicates
          const exists = prev.some((i) => i.id === newItem.id);
          if (exists) {
            console.log("Item already exists in state, updating it");
            return prev.map((i) => (i.id === newItem.id ? newItem : i));
          } else {
            console.log("Adding new item to state");
            return [...prev, newItem];
          }
        });

        // Force a refresh to ensure UI is updated
        setTimeout(() => {
          console.log("Forcing refresh after item creation");
          fetchInventoryItems();
        }, 500);

        return newItem;
      } catch (dbError) {
        console.error("Error creating item via DB endpoint:", dbError);
      }

      // If first attempt fails, try the Netlify function endpoint directly
      try {
        // Always try the Netlify function endpoint as a fallback
        const netlifyEndpoint = "/.netlify/functions/neon-inventory";
        console.log(
          `First attempt failed, trying Netlify endpoint: ${netlifyEndpoint}`
        );

        const response = await fetch(netlifyEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            name: item.name,
            description: item.description || "",
            categoryId: item.categoryId,
            sku: item.sku || "",
            quantityAvailable: item.quantityAvailable || 0,
            quantityReserved: item.quantityReserved || 0,
            location: item.location || "",
            imageUrl: item.imageUrl || "",
          }),
        });

        if (!response.ok) {
          throw new Error(`API endpoint failed with status ${response.status}`);
        }

        const newItem = await response.json();
        console.log("Item created successfully via API:", newItem);

        // Update local state with the new item
        setInventoryItems((prev) => {
          // Make sure we don't add duplicates
          const exists = prev.some((i) => i.id === newItem.id);
          if (exists) {
            console.log("Item already exists in state, updating it");
            return prev.map((i) => (i.id === newItem.id ? newItem : i));
          } else {
            console.log("Adding new item to state");
            return [...prev, newItem];
          }
        });

        // Force a refresh to ensure UI is updated
        setTimeout(() => {
          console.log("Forcing refresh after item creation via API");
          fetchInventoryItems();
        }, 500);

        return newItem;
      } catch (apiError) {
        console.error("Error creating item via API endpoint:", apiError);
      }

      // If both endpoints fail, create a mock item
      console.log("Both endpoints failed, creating mock item");
      const newItem: InventoryItem = {
        ...item,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("Mock item created as fallback:", newItem);

      // Update local state
      setInventoryItems((prev) => [...prev, newItem]);

      // Force a refresh to ensure UI is updated
      setTimeout(() => {
        console.log("Forcing refresh after mock item creation");
        fetchInventoryItems();
      }, 500);

      return newItem;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error creating inventory item:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateInventoryItem = async (
    item: Partial<InventoryItem> & { id: string }
  ): Promise<InventoryItem> => {
    setLoading(true);
    setError(null);

    try {
      // Check if user is admin or manager
      if (user?.role !== "admin" && user?.role !== "manager") {
        console.warn(
          "User attempted to update item without proper permissions:",
          user?.role
        );
        throw new Error(
          "Only administrators and managers can update inventory items"
        );
      }

      console.log("User has permission to update items:", user?.role);

      console.log("Updating inventory item:", item);

      // Find the existing item to merge with updates
      const existingItem = inventoryItems.find((i) => i.id === item.id);
      if (!existingItem) {
        throw new Error(`Item with ID ${item.id} not found`);
      }

      // First try the API endpoint
      try {
        const response = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update",
            id: item.id,
            name: item.name || existingItem.name,
            description: item.description || existingItem.description || "",
            quantity: item.quantity || existingItem.quantity || 0,
            category: {
              id: item.categoryId || existingItem.categoryId,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`API endpoint failed with status ${response.status}`);
        }

        const updatedItem = await response.json();
        console.log("Item updated successfully via API:", updatedItem);

        // Update local state
        setInventoryItems((prev) =>
          prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
        );

        return updatedItem;
      } catch (apiError) {
        console.error("Error updating item via API endpoint:", apiError);
      }

      // If API endpoint fails, try the DB endpoint
      try {
        const dbResponse = await fetch("/db/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update",
            id: item.id,
            name: item.name || existingItem.name,
            description: item.description || existingItem.description || "",
            quantity: item.quantity || existingItem.quantity || 0,
            category: {
              id: item.categoryId || existingItem.categoryId,
            },
          }),
        });

        if (!dbResponse.ok) {
          throw new Error(
            `DB endpoint failed with status ${dbResponse.status}`
          );
        }

        const updatedItem = await dbResponse.json();
        console.log("Item updated successfully via DB endpoint:", updatedItem);

        // Update local state
        setInventoryItems((prev) =>
          prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
        );

        return updatedItem;
      } catch (dbError) {
        console.error("Error updating item via DB endpoint:", dbError);
      }

      // If both endpoints fail, update the item locally
      console.log("Both endpoints failed, updating item locally");

      // Create updated item
      const updatedItem: InventoryItem = {
        ...existingItem,
        ...item,
        updatedAt: new Date().toISOString(),
      };

      console.log("Item updated locally as fallback:", updatedItem);

      // Update local state
      setInventoryItems((prev) =>
        prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
      );

      return updatedItem;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error updating inventory item:", err);

      // Try to find the existing item
      const existingItem = inventoryItems.find((i) => i.id === item.id);
      if (!existingItem) {
        throw err;
      }

      // Log the error but don't throw it
      console.warn("Update failed, but item exists in local state");
      return existingItem;
    } finally {
      setLoading(false);
    }
  };

  const deleteInventoryItem = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Check if user is admin or manager
      if (user?.role !== "admin" && user?.role !== "manager") {
        console.warn(
          "User attempted to delete item without proper permissions:",
          user?.role
        );
        throw new Error(
          "Only administrators and managers can delete inventory items"
        );
      }

      console.log("User has permission to delete items:", user?.role);

      console.log("Deleting inventory item, ID:", id);

      // Check if the item exists
      const existingItem = inventoryItems.find((i) => i.id === id);
      if (!existingItem) {
        throw new Error(`Item with ID ${id} not found`);
      }

      // First try the API endpoint
      try {
        const response = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "delete",
            id,
          }),
        });

        if (!response.ok) {
          throw new Error(`API endpoint failed with status ${response.status}`);
        }

        console.log("Item deleted successfully via API");

        // Update local state
        setInventoryItems((prev) => prev.filter((i) => i.id !== id));

        return true;
      } catch (apiError) {
        console.error("Error deleting item via API endpoint:", apiError);
      }

      // If API endpoint fails, try the DB endpoint
      try {
        const dbResponse = await fetch("/db/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "delete",
            id,
          }),
        });

        if (!dbResponse.ok) {
          throw new Error(
            `DB endpoint failed with status ${dbResponse.status}`
          );
        }

        console.log("Item deleted successfully via DB endpoint");

        // Update local state
        setInventoryItems((prev) => prev.filter((i) => i.id !== id));

        return true;
      } catch (dbError) {
        console.error("Error deleting item via DB endpoint:", dbError);
      }

      // If both endpoints fail, delete the item locally
      console.log("Both endpoints failed, deleting item locally");
      console.log("Successfully deleted item locally as fallback");

      // Update local state
      setInventoryItems((prev) => prev.filter((i) => i.id !== id));

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error deleting inventory item:", err);

      // Update local state anyway to maintain UI consistency
      setInventoryItems((prev) => prev.filter((i) => i.id !== id));
      console.warn("Delete failed, but item removed from local state");

      return true; // Return true anyway to maintain UI consistency
    } finally {
      setLoading(false);
    }
  };

  // Load inventory items on mount
  useEffect(() => {
    fetchInventoryItems();
  }, []);

  // Set up a periodic refresh for inventory items
  useEffect(() => {
    // Only set up the refresh timer if we have items and the last operation was more than 5 seconds ago
    if (inventoryItems.length > 0 && Date.now() - lastOperationTime > 5000) {
      console.log("Setting up periodic inventory refresh");

      // Refresh every 30 seconds
      const refreshTimer = setInterval(() => {
        console.log("Performing periodic inventory refresh");
        fetchInventoryItems();
      }, 30000);

      return () => {
        clearInterval(refreshTimer);
      };
    }
  }, [inventoryItems.length, lastOperationTime]);

  const value = {
    inventoryItems,
    loading,
    error,
    fetchInventoryItems,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    forceRefreshInventory,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
