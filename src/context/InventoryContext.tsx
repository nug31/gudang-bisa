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
      console.log(`Fetching inventory items (attempt ${retryCount + 1})...`);
      console.log(
        "Using Neon PostgreSQL database directly via /db/inventory endpoint"
      );

      // First try the db endpoint directly
      try {
        console.log("Trying to fetch inventory items from /db/inventory...");
        const dbResponse = await fetch("/db/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
            categoryId,
          }),
        });

        if (dbResponse.ok) {
          const text = await dbResponse.text();
          if (!text) {
            console.log("Empty response from DB endpoint");
            throw new Error("Empty response from server");
          }

          const data = JSON.parse(text);
          console.log(
            `Successfully fetched ${data.length} inventory items from Neon PostgreSQL`
          );

          if (data.length > 0) {
            console.log("First item:", data[0].name);
            console.log("Last item:", data[data.length - 1].name);
          } else {
            console.log("No items returned from database");
          }

          setInventoryItems(Array.isArray(data) ? data : []);
          setLoading(false);
          return;
        } else {
          console.log("DB endpoint failed, trying API endpoint...");
        }
      } catch (dbError) {
        console.error("Error fetching from /db/inventory:", dbError);
      }

      // Try the API endpoint as fallback
      try {
        console.log("Trying to fetch inventory items from /api/inventory...");
        const apiResponse = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
            categoryId,
          }),
        });

        if (apiResponse.ok) {
          const text = await apiResponse.text();
          if (!text) {
            console.log("Empty response from API endpoint");
            throw new Error("Empty response from server");
          }

          const data = JSON.parse(text);
          console.log(
            `Successfully fetched ${data.length} inventory items from API endpoint`
          );

          setInventoryItems(Array.isArray(data) ? data : []);
          setLoading(false);
          return;
        } else {
          console.log(`API endpoint failed with status ${apiResponse.status}`);
          throw new Error(
            `API request failed with status ${apiResponse.status}`
          );
        }
      } catch (apiError) {
        console.error("Error fetching from /api/inventory:", apiError);

        // If we haven't retried too many times, try again
        if (retryCount < 3) {
          console.log(
            `All endpoints failed, retrying (${retryCount + 1}/4)...`
          );
          setLoading(false);
          // Wait a bit longer before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return fetchInventoryItems(categoryId, retryCount + 1);
        }

        throw new Error("All endpoints failed after multiple retries");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching inventory items:", err);
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

      // First try the db endpoint directly
      try {
        console.log("Trying to fetch inventory item from /db/inventory...");
        const dbResponse = await fetch("/db/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getById",
            id,
          }),
        });

        if (dbResponse.ok) {
          const text = await dbResponse.text();
          if (!text) {
            console.log("Empty response from DB endpoint");
          } else {
            const item = JSON.parse(text);
            console.log(
              "Successfully fetched inventory item from DB endpoint:",
              item.name
            );
            setLoading(false);
            return item;
          }
        } else {
          console.log("DB endpoint failed, trying API endpoint...");
        }
      } catch (dbError) {
        console.error("Error fetching from /db/inventory:", dbError);
      }

      // Try the API endpoint as fallback
      try {
        console.log("Trying to fetch inventory item from /api/inventory...");
        const apiResponse = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getById",
            id,
          }),
        });

        if (apiResponse.ok) {
          const text = await apiResponse.text();
          if (!text) {
            console.log("Empty response from API endpoint");
          } else {
            const item = JSON.parse(text);
            console.log(
              "Successfully fetched inventory item from API endpoint:",
              item.name
            );
            setLoading(false);
            return item;
          }
        } else {
          console.log(`API endpoint failed with status ${apiResponse.status}`);
          throw new Error(
            `API request failed with status ${apiResponse.status}`
          );
        }
      } catch (apiError) {
        console.error("Error fetching from /api/inventory:", apiError);
      }

      // If we get here, both endpoints failed, try to find the item in the current inventory items
      const item = inventoryItems.find((item) => item.id === id);
      if (item) {
        console.log("Found item in current inventory items:", item.name);
        return item;
      }

      throw new Error("Item not found in any data source");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching inventory item:", err);

      // Last resort - try to find the item in the current inventory items
      const item = inventoryItems.find((item) => item.id === id);
      if (item) {
        console.log(
          "Found item in current inventory items as last resort:",
          item.name
        );
        return item;
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  const createInventoryItem = async (
    item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
  ): Promise<InventoryItem> => {
    setLoading(true);
    setError(null);

    try {
      // Check if user is admin or manager
      if (user?.role !== "admin" && user?.role !== "manager") {
        throw new Error(
          "Only administrators and managers can create inventory items"
        );
      }

      console.log("Creating inventory item using Neon PostgreSQL:", item);
      console.log("Using /db/inventory endpoint directly");

      // Use the /db/inventory endpoint which connects to Neon PostgreSQL
      const response = await fetch("/db/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          ...item,
          userId: user?.id,
          userRole: user?.role,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create inventory item: ${response.status} ${response.statusText}`
        );
      }

      const newItem = await response.json();
      console.log("Successfully created inventory item:", newItem);

      // Update local state
      setInventoryItems((prev) => [...prev, newItem]);

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
        throw new Error(
          "Only administrators and managers can update inventory items"
        );
      }

      console.log("Updating inventory item using Neon PostgreSQL:", item);
      console.log("Using /db/inventory endpoint directly");

      // Use the /db/inventory endpoint which connects to Neon PostgreSQL
      const response = await fetch("/db/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          ...item,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update inventory item: ${response.status} ${response.statusText}`
        );
      }

      const updatedItem = await response.json();
      console.log("Successfully updated inventory item:", updatedItem);

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
      console.warn("Update failed on server, but item exists in local state");
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
        throw new Error(
          "Only administrators and managers can delete inventory items"
        );
      }

      console.log("Deleting inventory item using Neon PostgreSQL, ID:", id);
      console.log("Using /db/inventory endpoint directly");

      // Use the /db/inventory endpoint which connects to Neon PostgreSQL
      const response = await fetch("/db/inventory", {
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
        throw new Error(
          `Failed to delete inventory item: ${response.status} ${response.statusText}`
        );
      }

      console.log("Successfully deleted inventory item");

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
      console.warn(
        "Delete failed on server, but item removed from local state"
      );

      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load inventory items on mount
  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const value = {
    inventoryItems,
    loading,
    error,
    fetchInventoryItems,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};
