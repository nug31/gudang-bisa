import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Search, Filter, AlertTriangle } from "lucide-react";
import { InventoryItem } from "../types/inventory";
import { useCategories } from "../hooks/useCategories";

export const BrowseItems = () => {
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading } = useCategories();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchInventoryItems = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        `Fetching inventory items in BrowseItems (attempt ${retryCount + 1})...`
      );

      // Simplified approach - just try the DB endpoint directly
      console.log("Fetching inventory items from DB endpoint...");

      try {
        // Make the request to the DB endpoint
        const response = await fetch("/db/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
          }),
        });

        // Check if the response is OK
        if (!response.ok) {
          console.error(`DB endpoint failed with status ${response.status}`);
          throw new Error(
            `Server returned ${response.status}: ${response.statusText}`
          );
        }

        // Get the response text
        const text = await response.text();

        // Check if the response is empty
        if (!text || text.trim() === "") {
          console.error("Empty response from server");
          throw new Error("Server returned an empty response");
        }

        // Parse the JSON response
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          throw new Error("Invalid response format from server");
        }

        // Check if the data is an array
        if (!Array.isArray(data)) {
          console.error("Response is not an array:", data);
          throw new Error("Invalid data format from server");
        }

        // Log success
        console.log(`Successfully fetched ${data.length} inventory items`);

        // Log the first few items for debugging
        if (data.length > 0) {
          console.log(
            "First 3 items:",
            data.slice(0, 3).map((item) => item.name)
          );
        } else {
          console.log("No items returned from server");
        }

        // Update state with the fetched data
        setItems(data);
        setFilteredItems(data);
        setError(null);

        return;
      } catch (error) {
        console.error("Error fetching inventory items:", error);

        // If we haven't retried too many times, try again
        if (retryCount < 2) {
          console.log(`Fetch failed, retrying (${retryCount + 1}/3)...`);
          // Wait a bit longer before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return fetchInventoryItems(retryCount + 1);
        }

        // If all retries failed, show error and use mock data as fallback
        setError(
          "Failed to load inventory items. Please check your connection and try again."
        );

        // Use mock data as a fallback
        console.log("Using mock data as fallback");
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
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  // Filter items when search term or category changes
  useEffect(() => {
    let result = items;

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((item) => item.categoryId === selectedCategory);
    }

    // Filter by search term
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
  }, [items, searchTerm, selectedCategory]);

  const handleRequestItem = (item: InventoryItem) => {
    // Log the item details before navigating
    console.log("Requesting item:", {
      id: item.id,
      name: item.name,
      type: typeof item.id,
      stringified: String(item.id),
    });

    // Create a direct request item object
    const requestItem = {
      id: String(item.id),
      name: item.name,
      quantity: 1,
      available: item.quantityAvailable,
    };

    // Store the request item in localStorage so it persists across page navigation
    localStorage.setItem("pendingRequestItem", JSON.stringify(requestItem));

    // Navigate to the new request page with the item pre-selected
    // Ensure the item ID is properly encoded in the URL
    const url = `/requests/new?itemId=${encodeURIComponent(String(item.id))}`;
    console.log("Navigating to:", url);

    // Use navigate with state to ensure the item data is available immediately
    navigate(url, {
      state: {
        selectedItem: item,
        requestItem: requestItem,
      },
    });
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
