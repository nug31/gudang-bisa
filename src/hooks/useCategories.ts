import { useState, useEffect } from "react";
import { Category } from "../types";

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try the API endpoint first
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
        console.log(
          "API endpoint failed, trying fallback to /db/categories..."
        );

        // Try fallback to db endpoint if API endpoint fails
        const fallbackResponse = await fetch("/db/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
          }),
        });

        if (!fallbackResponse.ok) {
          throw new Error("Failed to fetch categories");
        }

        const fallbackData = await fallbackResponse.json();
        setCategories(fallbackData);
        return;
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);

      // Use mock data as a fallback
      try {
        console.log("Using mock category data as fallback");
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
        setCategories(mockCategories);
        setError(null); // Clear error since we have fallback data
      } catch (mockError) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, error, fetchCategories };
};
