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
      const response = await fetch("/db/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getAll",
          categoryId,
        }),
      });

      // Check if the response is ok before trying to parse it
      if (!response.ok) {
        let errorMessage = "Failed to fetch inventory items";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }

        // If we get a server error and haven't retried too many times, try again
        if (response.status >= 500 && retryCount < 2) {
          console.log(`Server error, retrying (${retryCount + 1}/3)...`);
          setLoading(false);
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return fetchInventoryItems(categoryId, retryCount + 1);
        }

        throw new Error(errorMessage);
      }

      // Try to parse the response, handle empty responses
      let data = [];
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : [];
      } catch (parseError) {
        console.error("Error parsing response:", parseError);

        // If we can't parse the response and haven't retried too many times, try again
        if (retryCount < 2) {
          console.log(`Parse error, retrying (${retryCount + 1}/3)...`);
          setLoading(false);
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return fetchInventoryItems(categoryId, retryCount + 1);
        }

        throw new Error("Invalid response format from server");
      }

      console.log(`Successfully fetched ${data.length} inventory items`);
      setInventoryItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching inventory items:", err);
      // Set empty array on error to prevent UI issues
      setInventoryItems([]);

      // If we haven't retried too many times, try again
      if (retryCount < 2) {
        console.log(`Error occurred, retrying (${retryCount + 1}/3)...`);
        setLoading(false);
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchInventoryItems(categoryId, retryCount + 1);
      }
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
      const response = await fetch("/db/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getById",
          id,
        }),
      });

      // Check if the response is ok before trying to parse it
      if (!response.ok) {
        let errorMessage = "Failed to fetch inventory item";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      // Try to parse the response, handle empty responses
      try {
        const text = await response.text();
        if (!text) {
          throw new Error("Empty response from server");
        }
        return JSON.parse(text);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Invalid response format from server");
      }
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

      const response = await fetch("/db/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          ...item,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create inventory item");
      }

      const newItem = await response.json();

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
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update inventory item");
      }

      const updatedItem = await response.json();

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
      throw err;
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
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete inventory item");
      }

      // Update local state
      setInventoryItems((prev) => prev.filter((i) => i.id !== id));

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error deleting inventory item:", err);
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
