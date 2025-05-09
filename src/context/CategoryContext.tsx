import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Category } from "../types";
import { useAuth } from "./AuthContext";
import { v4 as uuidv4 } from "uuid";

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  getCategory: (id: string) => Category | undefined;
  createCategory: (category: Omit<Category, "id">) => Promise<Category>;
  updateCategory: (category: Category) => Promise<Category>;
  deleteCategory: (id: string) => Promise<boolean>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(
  undefined
);

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error("useCategories must be used within a CategoryProvider");
  }
  return context;
};

interface CategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider: React.FC<CategoryProviderProps> = ({
  children,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting to fetch categories from Netlify function");

      // First try the Netlify function for Neon PostgreSQL
      try {
        const response = await fetch("/.netlify/functions/neon-categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
          }),
        });

        console.log("Neon categories response status:", response.status);

        // Check if the response is ok before trying to parse it
        if (response.ok) {
          // Try to parse the response, handle empty responses
          const text = await response.text();
          const data = text ? JSON.parse(text) : [];
          console.log("Successfully fetched categories from Neon:", data);
          setCategories(Array.isArray(data) ? data : []);
          setLoading(false);
          return;
        } else {
          console.error(
            "Neon categories response not OK:",
            await response.text()
          );
        }
      } catch (neonError) {
        console.error("Error fetching from Neon categories:", neonError);
      }

      // If Netlify function fails, try the db endpoint
      console.log("Trying fallback to /db/categories endpoint");
      try {
        const dbResponse = await fetch("/db/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
          }),
        });

        if (dbResponse.ok) {
          const dbData = await dbResponse.json();
          console.log("Successfully fetched categories from DB:", dbData);
          setCategories(Array.isArray(dbData) ? dbData : []);
          setLoading(false);
          return;
        }
      } catch (dbError) {
        console.error("Error fetching from /db/categories:", dbError);
      }

      // If db endpoint fails, try the API endpoint
      console.log("Trying fallback to /api/categories endpoint");
      try {
        const apiResponse = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
          }),
        });

        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          console.log("Successfully fetched categories from API:", apiData);
          setCategories(Array.isArray(apiData) ? apiData : []);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.error("Error fetching from /api/categories:", apiError);
      }

      // If both endpoints fail, use mock data
      console.log("Both endpoints failed, using mock data");
      const mockCategories = [
        { id: "1", name: "Office", description: "Office supplies" },
        { id: "2", name: "Cleaning", description: "Cleaning supplies" },
        {
          id: "3",
          name: "Hardware",
          description: "Hardware tools and supplies",
        },
        { id: "4", name: "Other", description: "Miscellaneous items" },
      ];

      console.log("Using mock categories:", mockCategories);
      setCategories(mockCategories);
      setError("Using mock data - database connection failed");
    } catch (err) {
      console.error("Unexpected error in fetchCategories:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );

      // Use mock data as last resort
      const mockCategories = [
        { id: "1", name: "Office", description: "Office supplies" },
        { id: "2", name: "Cleaning", description: "Cleaning supplies" },
        {
          id: "3",
          name: "Hardware",
          description: "Hardware tools and supplies",
        },
        { id: "4", name: "Other", description: "Miscellaneous items" },
      ];

      console.log("Using mock categories as last resort:", mockCategories);
      setCategories(mockCategories);
    } finally {
      setLoading(false);
    }
  };

  const getCategory = (id: string): Category | undefined => {
    return categories.find((category) => category.id === id);
  };

  const createCategory = async (
    category: Omit<Category, "id">
  ): Promise<Category> => {
    setLoading(true);
    setError(null);

    try {
      // Check if user is admin or manager
      if (user?.role !== "admin" && user?.role !== "manager") {
        throw new Error(
          "Only administrators and managers can create categories"
        );
      }

      console.log("Creating category using Netlify function:", category);

      const response = await fetch("/.netlify/functions/neon-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          ...category,
        }),
      });

      console.log("Create category response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error creating category:", errorData);
        throw new Error(errorData.message || "Failed to create category");
      }

      const newCategory = await response.json();
      console.log("Category created successfully:", newCategory);

      // Update local state
      setCategories((prev) => [...prev, newCategory]);

      return newCategory;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error creating category:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (category: Category): Promise<Category> => {
    setLoading(true);
    setError(null);

    try {
      // Check if user is admin or manager
      if (user?.role !== "admin" && user?.role !== "manager") {
        throw new Error(
          "Only administrators and managers can update categories"
        );
      }

      console.log("Updating category using Netlify function:", category);

      const response = await fetch("/.netlify/functions/neon-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          ...category,
        }),
      });

      console.log("Update category response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error updating category:", errorData);
        throw new Error(errorData.message || "Failed to update category");
      }

      const updatedCategory = await response.json();
      console.log("Category updated successfully:", updatedCategory);

      // Update local state
      setCategories((prev) =>
        prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
      );

      return updatedCategory;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error updating category:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Check if user is admin or manager
      if (user?.role !== "admin" && user?.role !== "manager") {
        throw new Error(
          "Only administrators and managers can delete categories"
        );
      }

      console.log("Deleting category using Netlify function, ID:", id);

      const response = await fetch("/.netlify/functions/neon-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          id,
        }),
      });

      console.log("Delete category response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error deleting category:", errorData);
        throw new Error(errorData.message || "Failed to delete category");
      }

      console.log("Category deleted successfully");

      // Update local state
      setCategories((prev) => prev.filter((c) => c.id !== id));

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error deleting category:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const value = {
    categories,
    loading,
    error,
    fetchCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};
