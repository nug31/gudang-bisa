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
      const response = await fetch("/.netlify/functions/db-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getAll",
        }),
      });

      // Check if the response is ok before trying to parse it
      if (!response.ok) {
        let errorMessage = "Failed to fetch categories";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
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
        throw new Error("Invalid response format from server");
      }

      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching categories:", err);
      // Set empty array on error to prevent UI issues
      setCategories([]);
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

      const response = await fetch("/.netlify/functions/db-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          ...category,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create category");
      }

      const newCategory = await response.json();

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

      const response = await fetch("/.netlify/functions/db-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          ...category,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update category");
      }

      const updatedCategory = await response.json();

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

      const response = await fetch("/.netlify/functions/db-categories", {
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
        throw new Error(errorData.message || "Failed to delete category");
      }

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
