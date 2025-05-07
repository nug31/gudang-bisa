import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Search, Filter, AlertTriangle } from "lucide-react";
import { InventoryItem } from "../types/inventory";
import { useCategories } from "../hooks";

export const BrowseItems = () => {
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading } = useCategories();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchInventoryItems = async (categoryId = null, retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        `Fetching inventory items in BrowseItems (attempt ${retryCount + 1})...`
      );

      // Prepare request body with optional category filter
      const requestBody = {
        action: "getAll",
      };

      // Add category filter if not "all"
      if (categoryId && categoryId !== "all") {
        requestBody.categoryId = categoryId;
      }

      // Try the API endpoint first
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.log(`API endpoint failed, trying fallback to /db/inventory...`);

        // Try fallback to db endpoint if API endpoint fails
        const fallbackResponse = await fetch("/db/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!fallbackResponse.ok) {
          // If we get a server error and haven't retried too many times, try again
          if (fallbackResponse.status >= 500 && retryCount < 2) {
            console.log(`Server error, retrying (${retryCount + 1}/3)...`);
            setLoading(false);
            // Wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return fetchInventoryItems(categoryId, retryCount + 1);
          }

          throw new Error("Failed to fetch inventory items");
        }

        // Try to parse the fallback response
        try {
          const text = await fallbackResponse.text();
          const data = text ? JSON.parse(text) : [];
          console.log(
            `Successfully fetched ${data.length} inventory items from fallback in BrowseItems`
          );
          setItems(data);
          setFilteredItems(data);
          setError(null);
          setLoading(false);
          return;
        } catch (parseError) {
          console.error("Error parsing fallback response:", parseError);
          throw new Error("Invalid response format from server");
        }
      }

      // Try to parse the response
      let data;
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
          return fetchInventoryItems(retryCount + 1);
        }

        throw new Error("Invalid response format from server");
      }

      console.log(
        `Successfully fetched ${data.length} inventory items in BrowseItems`
      );
      setItems(data);
      setFilteredItems(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching inventory items:", err);

      // Try to use mock data as a last resort
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
          {
            id: "4",
            name: "Screwdriver Set",
            description: "Set of 6 screwdrivers",
            categoryId: "3",
            categoryName: "Hardware",
            sku: "HW-001",
            quantityAvailable: 15,
            quantityReserved: 1,
            unitPrice: 12.99,
            location: "Shelf C1",
            imageUrl: "/img/items/screwdriver.jpg",
            createdAt: "2023-01-01T00:00:00Z",
          },
          {
            id: "5",
            name: "First Aid Kit",
            description: "Basic first aid kit",
            categoryId: "4",
            categoryName: "Other",
            sku: "OT-001",
            quantityAvailable: 10,
            quantityReserved: 0,
            unitPrice: 15.99,
            location: "Shelf D1",
            imageUrl: "/img/items/firstaid.jpg",
            createdAt: "2023-01-01T00:00:00Z",
          },
        ];

        setItems(mockData);
        setFilteredItems(mockData);
        setError(null);
      } catch (mockError) {
        console.error("Error using mock data:", mockError);
        setError("Failed to load inventory items. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch items when component mounts or when category changes
  useEffect(() => {
    fetchInventoryItems(selectedCategory);
  }, [selectedCategory]);

  // Filter items when search term changes
  useEffect(() => {
    let result = items;

    // Filter by search term only (category filtering is done on the server)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term)) ||
          (item.sku && item.sku.toLowerCase().includes(term))
      );
    }

    setFilteredItems(result);
  }, [items, searchTerm]);

  const handleRequestItem = (item: InventoryItem) => {
    // Navigate to the new request page with the item pre-selected
    navigate(`/requests/new?itemId=${item.id}`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          Browse Items
        </h1>

        {/* Search and Filter */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-3d-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <Filter className="text-neutral-500 h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Categories:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Always show "All" option */}
              <button
                key="all"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedCategory === "all"
                    ? "bg-primary-500 text-white shadow-3d-sm"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                All
              </button>

              {/* Show actual categories from the database */}
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedCategory === category.id
                      ? "bg-primary-500 text-white shadow-3d-sm"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {loading || categoriesLoading ? (
          <div className="flex justify-center items-center h-40 sm:h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full shadow-3d-sm"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-40 sm:h-64 text-error-500 px-4 text-center">
            <div className="flex items-center mb-4">
              <AlertTriangle className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              onClick={() => fetchInventoryItems()}
              variant="outline"
              className="mt-2 shadow-3d-sm hover:shadow-3d-md transition-all"
            >
              Try Again
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex justify-center items-center h-40 sm:h-64 text-neutral-500 px-4 text-center">
            No items found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden shadow-3d-sm hover:shadow-3d-md transition-all"
              >
                <CardContent className="p-0">
                  <div className="p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold">
                      {item.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-500 mt-1 line-clamp-2">
                      {item.description || "No description available"}
                    </p>

                    <div className="mt-3 sm:mt-4 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            item.quantityAvailable > 10
                              ? "bg-success-100 text-success-700"
                              : item.quantityAvailable > 0
                              ? "bg-warning-100 text-warning-700"
                              : "bg-error-100 text-error-700"
                          }`}
                        >
                          {item.quantityAvailable} available
                        </span>

                        {item.quantityAvailable <= 5 &&
                          item.quantityAvailable > 0 && (
                            <span className="text-warning-500 text-xs flex items-center whitespace-nowrap">
                              <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                              Low stock
                            </span>
                          )}
                      </div>

                      <Button
                        onClick={() => handleRequestItem(item)}
                        disabled={item.quantityAvailable === 0}
                        size="sm"
                        className="shadow-3d-sm hover:shadow-3d-md transition-all"
                      >
                        Request
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
