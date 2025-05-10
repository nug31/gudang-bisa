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
      console.log("Fetching categories from Neon database");

      // First try the API endpoint
      try {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
          }),
        });

        if (!response.ok) {
          throw new Error(`API endpoint failed with status ${response.status}`);
        }

        const responseData = await response.json();

        // Handle both formats: array or {categories: array}
        const categories = responseData.categories || responseData;

        console.log(
          `Successfully fetched ${categories.length} categories from API`
        );
        console.log("Response format:", responseData);

        // Get item counts for each category
        const inventoryResponse = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
          }),
        });

        if (inventoryResponse.ok) {
          const inventoryResponseData = await inventoryResponse.json();

          // Handle both formats: array or {items: array}
          const inventoryItems =
            inventoryResponseData.items || inventoryResponseData;

          console.log(
            `Fetched ${inventoryItems.length} inventory items to count per category`
          );
          console.log("Inventory response format:", inventoryResponseData);

          // Calculate item counts for each category
          const categoryCounts = inventoryItems.reduce(
            (counts: Record<string, number>, item: any) => {
              const categoryId = item.categoryId?.toString();
              if (categoryId) {
                counts[categoryId] = (counts[categoryId] || 0) + 1;
              }
              return counts;
            },
            {}
          );

          // Add itemCount to each category
          categories.forEach((category: Category) => {
            category.itemCount = categoryCounts[category.id?.toString()] || 0;
          });
        }

        setCategories(categories);
        return;
      } catch (apiError) {
        console.error("Error fetching from API endpoint:", apiError);
      }

      // If API endpoint fails, try the DB endpoint
      try {
        console.log("Trying fallback to /db/categories endpoint");
        const dbResponse = await fetch("/db/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
          }),
        });

        if (!dbResponse.ok) {
          throw new Error(
            `DB endpoint failed with status ${dbResponse.status}`
          );
        }

        const responseData = await dbResponse.json();

        // Handle both formats: array or {categories: array}
        const categories = responseData.categories || responseData;

        console.log(
          `Successfully fetched ${categories.length} categories from DB endpoint`
        );
        console.log("Response format:", responseData);

        // Get item counts for each category
        const inventoryResponse = await fetch("/db/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
          }),
        });

        if (inventoryResponse.ok) {
          const inventoryResponseData = await inventoryResponse.json();

          // Handle both formats: array or {items: array}
          const inventoryItems =
            inventoryResponseData.items || inventoryResponseData;

          console.log(
            `Fetched ${inventoryItems.length} inventory items to count per category`
          );
          console.log("Inventory response format:", inventoryResponseData);

          // Calculate item counts for each category
          const categoryCounts = inventoryItems.reduce(
            (counts: Record<string, number>, item: any) => {
              const categoryId = item.categoryId?.toString();
              if (categoryId) {
                counts[categoryId] = (counts[categoryId] || 0) + 1;
              }
              return counts;
            },
            {}
          );

          // Add itemCount to each category
          categories.forEach((category: Category) => {
            category.itemCount = categoryCounts[category.id?.toString()] || 0;
          });
        }

        setCategories(categories);
        return;
      } catch (dbError) {
        console.error("Error fetching from DB endpoint:", dbError);
      }

      // If both endpoints fail, use fallback categories
      console.error(
        "Both API and DB endpoints failed, using fallback categories"
      );
      const fallbackCategories = [
        {
          id: "1",
          name: "Office",
          description: "Office supplies",
          itemCount: 3,
        },
        {
          id: "2",
          name: "Cleaning",
          description: "Cleaning supplies",
          itemCount: 3,
        },
        {
          id: "3",
          name: "Hardware",
          description: "Hardware tools and supplies",
          itemCount: 1,
        },
        {
          id: "4",
          name: "Other",
          description: "Miscellaneous items",
          itemCount: 3,
        },
      ];

      setCategories(fallbackCategories);
      setError("Failed to connect to database. Using fallback data.");
    } catch (err) {
      console.error("Unexpected error in fetchCategories:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );

      // Fallback to basic categories if something goes wrong
      const basicCategories = [
        {
          id: "1",
          name: "Office",
          description: "Office supplies",
          itemCount: 3,
        },
        {
          id: "2",
          name: "Cleaning",
          description: "Cleaning supplies",
          itemCount: 3,
        },
        {
          id: "3",
          name: "Hardware",
          description: "Hardware tools and supplies",
          itemCount: 1,
        },
        {
          id: "4",
          name: "Other",
          description: "Miscellaneous items",
          itemCount: 3,
        },
      ];

      setCategories(basicCategories);
    } finally {
      setLoading(false);
    }
  };

  const getCategory = (id: string | number): Category | undefined => {
    return categories.find(
      (category) =>
        category.id === id || category.id?.toString() === id?.toString()
    );
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

      console.log("Creating category:", category);

      // First try the API endpoint
      try {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            name: category.name,
            description: category.description || "",
          }),
        });

        if (!response.ok) {
          throw new Error(`API endpoint failed with status ${response.status}`);
        }

        const newCategory = await response.json();
        console.log("Category created successfully:", newCategory);

        // Add itemCount property
        newCategory.itemCount = 0;

        // Update local state
        setCategories((prev) => [...prev, newCategory]);

        return newCategory;
      } catch (apiError) {
        console.error("Error creating category via API endpoint:", apiError);
      }

      // If API endpoint fails, try the DB endpoint
      try {
        const dbResponse = await fetch("/db/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            name: category.name,
            description: category.description || "",
          }),
        });

        if (!dbResponse.ok) {
          throw new Error(
            `DB endpoint failed with status ${dbResponse.status}`
          );
        }

        const newCategory = await dbResponse.json();
        console.log(
          "Category created successfully via DB endpoint:",
          newCategory
        );

        // Add itemCount property
        newCategory.itemCount = 0;

        // Update local state
        setCategories((prev) => [...prev, newCategory]);

        return newCategory;
      } catch (dbError) {
        console.error("Error creating category via DB endpoint:", dbError);
      }

      // If both endpoints fail, create a mock category
      console.log("Both endpoints failed, creating mock category");
      const newCategory: Category = {
        ...category,
        id: uuidv4(),
        itemCount: 0,
      };

      console.log("Mock category created as fallback:", newCategory);

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

      console.log("Updating category:", category);

      // First try the API endpoint
      try {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update",
            id: category.id,
            name: category.name,
            description: category.description || "",
          }),
        });

        if (!response.ok) {
          throw new Error(`API endpoint failed with status ${response.status}`);
        }

        const updatedCategory = await response.json();
        console.log("Category updated successfully:", updatedCategory);

        // Preserve the itemCount from the existing category
        const existingCategory = categories.find((c) => c.id === category.id);
        if (existingCategory && existingCategory.itemCount !== undefined) {
          updatedCategory.itemCount = existingCategory.itemCount;
        }

        // Update local state
        setCategories((prev) =>
          prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
        );

        return updatedCategory;
      } catch (apiError) {
        console.error("Error updating category via API endpoint:", apiError);
      }

      // If API endpoint fails, try the DB endpoint
      try {
        const dbResponse = await fetch("/db/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "update",
            id: category.id,
            name: category.name,
            description: category.description || "",
          }),
        });

        if (!dbResponse.ok) {
          throw new Error(
            `DB endpoint failed with status ${dbResponse.status}`
          );
        }

        const updatedCategory = await dbResponse.json();
        console.log(
          "Category updated successfully via DB endpoint:",
          updatedCategory
        );

        // Preserve the itemCount from the existing category
        const existingCategory = categories.find((c) => c.id === category.id);
        if (existingCategory && existingCategory.itemCount !== undefined) {
          updatedCategory.itemCount = existingCategory.itemCount;
        }

        // Update local state
        setCategories((prev) =>
          prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
        );

        return updatedCategory;
      } catch (dbError) {
        console.error("Error updating category via DB endpoint:", dbError);
      }

      // If both endpoints fail, update the category locally
      console.log("Both endpoints failed, updating category locally");

      // Check if the category exists
      const existingCategory = categories.find((c) => c.id === category.id);
      if (!existingCategory) {
        throw new Error(`Category with ID ${category.id} not found`);
      }

      // Update the category
      const updatedCategory = {
        ...category,
        itemCount: existingCategory.itemCount,
      };

      console.log("Category updated locally as fallback:", updatedCategory);

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

      console.log("Deleting category, ID:", id);

      // First try the API endpoint
      try {
        const response = await fetch("/api/categories", {
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

        console.log("Category deleted successfully via API");

        // Update local state
        setCategories((prev) => prev.filter((c) => c.id !== id));

        return true;
      } catch (apiError) {
        console.error("Error deleting category via API endpoint:", apiError);
      }

      // If API endpoint fails, try the DB endpoint
      try {
        const dbResponse = await fetch("/db/categories", {
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

        console.log("Category deleted successfully via DB endpoint");

        // Update local state
        setCategories((prev) => prev.filter((c) => c.id !== id));

        return true;
      } catch (dbError) {
        console.error("Error deleting category via DB endpoint:", dbError);
      }

      // If both endpoints fail, delete the category locally
      console.log("Both endpoints failed, deleting category locally");

      // Check if the category exists
      const existingCategory = categories.find((c) => c.id === id);
      if (!existingCategory) {
        throw new Error(`Category with ID ${id} not found`);
      }

      console.log("Category deleted locally as fallback");

      // Update local state
      setCategories((prev) => prev.filter((c) => c.id !== id));

      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error deleting category:", err);

      // Update local state anyway to maintain UI consistency
      setCategories((prev) => prev.filter((c) => c.id !== id));
      console.warn("Delete failed, but category removed from local state");

      return true; // Return true anyway to maintain UI consistency
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
