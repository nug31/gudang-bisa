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
      console.log("Fetching categories from Neon database");

      // Try the Netlify function endpoint first
      const response = await fetch("/.netlify/functions/neon-categories", {
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
          "Netlify function endpoint failed, trying fallback to API endpoint..."
        );

        // Try the API endpoint if Netlify function endpoint fails
        const apiResponse = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
          }),
        });

        if (!apiResponse.ok) {
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
          console.log(
            "Received categories from fallback endpoint:",
            fallbackData
          );

          // Handle different response formats
          const categoriesArray = fallbackData.categories || fallbackData;
          setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
          return;
        }

        const apiData = await apiResponse.json();
        console.log("Received categories from API endpoint:", apiData);

        // Handle different response formats
        const categoriesArray = apiData.categories || apiData;
        setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
        return;
      }

      const data = await response.json();
      console.log("Received categories from Netlify function endpoint:", data);

      // Handle different response formats
      const categoriesArray = data.categories || data;
      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
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
          {
            id: "5",
            name: "Electronics",
            description: "Electronic devices and accessories",
          },
          { id: "6", name: "Furniture", description: "Office furniture" },
          {
            id: "7",
            name: "Kitchen Supplies",
            description: "Kitchen and breakroom supplies",
          },
          {
            id: "8",
            name: "Printing Supplies",
            description: "Printing and copying supplies",
          },
          {
            id: "9",
            name: "Office Supplies",
            description: "General office supplies",
          },
          {
            id: "10",
            name: "Packaging Materials",
            description: "Packaging and shipping materials",
          },
        ];
        console.log("Mock categories:", mockCategories);
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
