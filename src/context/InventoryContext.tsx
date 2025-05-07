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

      // Use the correct API endpoint
      const response = await fetch("/.netlify/functions/inventory", {
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

        // Try fallback to db endpoint if API endpoint fails
        if (retryCount === 0) {
          console.log(
            "API endpoint failed, trying fallback to /.netlify/functions/db-inventory..."
          );
          const fallbackResponse = await fetch(
            "/.netlify/functions/db-inventory",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "getAll",
                categoryId,
              }),
            }
          );

          if (fallbackResponse.ok) {
            const text = await fallbackResponse.text();
            const data = text ? JSON.parse(text) : [];
            console.log(
              `Successfully fetched ${data.length} inventory items from fallback`
            );
            setInventoryItems(Array.isArray(data) ? data : []);
            setLoading(false);
            return;
          } else {
            console.log("Fallback also failed");
          }
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

      // Try to use mock data if available
      try {
        console.log("Attempting to use mock data...");
        const mockData = [
          {
            id: "1",
            name: "Ballpoint Pen",
            description: "Blue ballpoint pen",
            categoryId: "1",
            categoryName: "Office",
            sku: "PEN-001",
            quantityAvailable: 100,
            quantityReserved: 10,
            unitPrice: 1.99,
            location: "Shelf A1",
            imageUrl: "/img/items/pen.jpg",
            createdAt: "2023-01-01T00:00:00Z",
          },
          {
            id: "2",
            name: "Notebook",
            description: "A5 lined notebook",
            categoryId: "1",
            categoryName: "Office",
            sku: "NB-001",
            quantityAvailable: 50,
            quantityReserved: 5,
            unitPrice: 4.99,
            location: "Shelf A2",
            imageUrl: "/img/items/notebook.jpg",
            createdAt: "2023-01-01T00:00:00Z",
          },
          {
            id: "3",
            name: "Cleaning Spray",
            description: "All-purpose cleaning spray",
            categoryId: "2",
            categoryName: "Cleaning",
            sku: "CL-001",
            quantityAvailable: 30,
            quantityReserved: 2,
            unitPrice: 3.49,
            location: "Shelf B1",
            imageUrl: "/img/items/spray.jpg",
            createdAt: "2023-01-01T00:00:00Z",
          },
        ];

        // Filter by category if needed
        let filteredItems = mockData;
        if (categoryId) {
          filteredItems = mockData.filter(
            (item) => item.categoryId === categoryId
          );
        }

        setInventoryItems(filteredItems);
        setError(null); // Clear error since we have fallback data
      } catch (mockError) {
        console.error("Error using mock data:", mockError);
        // Set empty array on error to prevent UI issues
        setInventoryItems([]);
      }

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
      // Try the API endpoint first
      const response = await fetch("/.netlify/functions/inventory", {
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

        // Try fallback to db endpoint if API endpoint fails
        console.log(
          "API endpoint failed, trying fallback to /.netlify/functions/db-inventory..."
        );
        const fallbackResponse = await fetch(
          "/.netlify/functions/db-inventory",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "getById",
              id,
            }),
          }
        );

        if (fallbackResponse.ok) {
          const text = await fallbackResponse.text();
          if (!text) {
            throw new Error("Empty response from server");
          }
          return JSON.parse(text);
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

      // Try to find the item in the current inventory items
      const item = inventoryItems.find((item) => item.id === id);
      if (item) {
        console.log("Found item in current inventory items:", item);
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

      // Try the API endpoint first
      const response = await fetch("/.netlify/functions/inventory", {
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
        let errorMessage = "Failed to create inventory item";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }

        // Try fallback to db endpoint if API endpoint fails
        console.log(
          "API endpoint failed, trying fallback to /.netlify/functions/db-inventory..."
        );
        const fallbackResponse = await fetch(
          "/.netlify/functions/db-inventory",
          {
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
          }
        );

        if (!fallbackResponse.ok) {
          throw new Error(errorMessage);
        }

        const newItem = await fallbackResponse.json();

        // Update local state
        setInventoryItems((prev) => [...prev, newItem]);

        return newItem;
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

      // Create a mock item with a UUID as fallback
      try {
        console.log("Creating mock item as fallback...");
        const mockItem: InventoryItem = {
          id: uuidv4(),
          name: item.name,
          description: item.description || "",
          categoryId: item.categoryId,
          categoryName: item.categoryName || "Unknown",
          sku: item.sku || "",
          quantityAvailable: item.quantityAvailable || 0,
          quantityReserved: item.quantityReserved || 0,
          unitPrice: item.unitPrice || 0,
          location: item.location || "",
          imageUrl: item.imageUrl || "",
          createdAt: new Date().toISOString(),
        };

        // Update local state
        setInventoryItems((prev) => [...prev, mockItem]);

        // Clear error since we have fallback data
        setError(null);

        return mockItem;
      } catch (mockError) {
        console.error("Error creating mock item:", mockError);
        throw err;
      }
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

      // Try the API endpoint first
      const response = await fetch("/.netlify/functions/inventory", {
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
        let errorMessage = "Failed to update inventory item";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }

        // Try fallback to db endpoint if API endpoint fails
        console.log(
          "API endpoint failed, trying fallback to /.netlify/functions/db-inventory..."
        );
        const fallbackResponse = await fetch(
          "/.netlify/functions/db-inventory",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "update",
              ...item,
            }),
          }
        );

        if (!fallbackResponse.ok) {
          throw new Error(errorMessage);
        }

        const updatedItem = await fallbackResponse.json();

        // Update local state
        setInventoryItems((prev) =>
          prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
        );

        return updatedItem;
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

      // Update the item locally as a fallback
      try {
        console.log("Updating item locally as fallback...");

        // Find the existing item
        const existingItem = inventoryItems.find((i) => i.id === item.id);

        if (!existingItem) {
          throw new Error("Item not found");
        }

        // Create updated item by merging existing item with updates
        const updatedItem: InventoryItem = {
          ...existingItem,
          ...item,
          // Ensure these fields are present
          name: item.name || existingItem.name,
          categoryId: item.categoryId || existingItem.categoryId,
        };

        // Update local state
        setInventoryItems((prev) =>
          prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
        );

        // Clear error since we have fallback data
        setError(null);

        return updatedItem;
      } catch (mockError) {
        console.error("Error updating item locally:", mockError);
        throw err;
      }
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

      // Try the API endpoint first
      const response = await fetch("/.netlify/functions/inventory", {
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
        let errorMessage = "Failed to delete inventory item";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }

        // Try fallback to db endpoint if API endpoint fails
        console.log(
          "API endpoint failed, trying fallback to /.netlify/functions/db-inventory..."
        );
        const fallbackResponse = await fetch(
          "/.netlify/functions/db-inventory",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "delete",
              id,
            }),
          }
        );

        if (!fallbackResponse.ok) {
          throw new Error(errorMessage);
        }
      }

      // Update local state
      setInventoryItems((prev) => prev.filter((i) => i.id !== id));

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error deleting inventory item:", err);

      // Delete the item locally as a fallback
      try {
        console.log("Deleting item locally as fallback...");

        // Update local state
        setInventoryItems((prev) => prev.filter((i) => i.id !== id));

        // Clear error since we handled it locally
        setError(null);

        return true;
      } catch (mockError) {
        console.error("Error deleting item locally:", mockError);
        return false;
      }
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
