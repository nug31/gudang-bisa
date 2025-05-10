import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Search, Filter, AlertTriangle, ShoppingCart } from "lucide-react";
import { InventoryItem } from "../types/inventory";
import { useCategories } from "../hooks/useCategories";
import { MockDataNotice } from "../components/MockDataNotice";
import { ensureArray, safeMap, safeFilter } from "../utils/arrayUtils";

// Helper function to get the available quantity
const getQuantityAvailable = (item: InventoryItem) => {
  // Handle both formats: item.quantityAvailable and item.quantity_available
  return item.quantityAvailable !== undefined
    ? item.quantityAvailable
    : item.quantity_available !== undefined
    ? item.quantity_available
    : 0;
};

// Mock data function to provide fallback data when database connection fails
const getMockInventoryData = () => {
  console.log("Using mock inventory data");
  return [
    {
      id: "1",
      name: "All-Purpose Cleaner",
      description: "Multi-surface cleaning solution, 32oz bottle",
      categoryId: "2",
      categoryName: "Cleaning Supplies",
      sku: "CL-001",
      quantityAvailable: 20,
      quantityReserved: 0,
      unitPrice: 4.99,
      location: "Shelf B1",
      imageUrl: "/img/items/cleaner.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Ballpoint Pens (Box of 12)",
      description: "Blue ink ballpoint pens, medium point",
      categoryId: "1",
      categoryName: "Office Supplies",
      sku: "OS-001",
      quantityAvailable: 50,
      quantityReserved: 0,
      unitPrice: 3.99,
      location: "Shelf A1",
      imageUrl: "/img/items/pens.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Disinfectant Wipes (Pack of 75)",
      description: "Multi-surface cleaning and disinfecting wipes",
      categoryId: "2",
      categoryName: "Cleaning Supplies",
      sku: "CL-002",
      quantityAvailable: 40,
      quantityReserved: 0,
      unitPrice: 5.99,
      location: "Shelf B2",
      imageUrl: "/img/items/wipes.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "4",
      name: "First Aid Kit",
      description: "Comprehensive first aid kit for office emergencies",
      categoryId: "4",
      categoryName: "Other",
      sku: "OT-001",
      quantityAvailable: 15,
      quantityReserved: 0,
      unitPrice: 24.99,
      location: "Shelf D1",
      imageUrl: "/img/items/firstaid.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "5",
      name: "Hammer",
      description: "16oz claw hammer with fiberglass handle",
      categoryId: "3",
      categoryName: "Hardware",
      sku: "HW-001",
      quantityAvailable: 10,
      quantityReserved: 0,
      unitPrice: 12.99,
      location: "Shelf C1",
      imageUrl: "/img/items/hammer.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "6",
      name: "Paper Towels (6 rolls)",
      description: "Absorbent paper towels for cleaning spills",
      categoryId: "2",
      categoryName: "Cleaning Supplies",
      sku: "CL-003",
      quantityAvailable: 30,
      quantityReserved: 0,
      unitPrice: 8.99,
      location: "Shelf B3",
      imageUrl: "/img/items/papertowels.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "7",
      name: "Stapler",
      description: "Desktop stapler with 5000 staples included",
      categoryId: "1",
      categoryName: "Office Supplies",
      sku: "OS-002",
      quantityAvailable: 25,
      quantityReserved: 0,
      unitPrice: 7.99,
      location: "Shelf A2",
      imageUrl: "/img/items/stapler.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "8",
      name: "Wireless Mouse",
      description: "Ergonomic wireless mouse with USB receiver",
      categoryId: "5",
      categoryName: "Electronics",
      sku: "EL-001",
      quantityAvailable: 12,
      quantityReserved: 0,
      unitPrice: 14.99,
      location: "Shelf E1",
      imageUrl: "/img/items/mouse.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "9",
      name: "Office Chair",
      description: "Adjustable ergonomic office chair with lumbar support",
      categoryId: "6",
      categoryName: "Furniture",
      sku: "FN-001",
      quantityAvailable: 5,
      quantityReserved: 0,
      unitPrice: 129.99,
      location: "Warehouse Section F",
      imageUrl: "/img/items/chair.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};

export const BrowseItems = () => {
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading } = useCategories();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [usingMockData, setUsingMockData] = useState(false);
  const [cartItems, setCartItems] = useState<
    { id: string; name: string; quantity: number }[]
  >([]);
  const [showCart, setShowCart] = useState(false);

  const fetchInventoryItems = async (categoryId?: string) => {
    try {
      setLoading(true);
      setError(null);
      setUsingMockData(false); // Reset mock data flag

      console.log("Fetching inventory items from Neon database");

      // Try the Netlify function endpoint first
      const response = await fetch("/.netlify/functions/neon-inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getAll",
          categoryId: categoryId !== "all" ? categoryId : undefined,
        }),
      });

      if (!response.ok) {
        console.log(
          `Netlify function endpoint failed, trying fallback to API endpoint...`
        );

        // Try fallback to API endpoint if Netlify function endpoint fails
        const apiResponse = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "getAll",
            categoryId: categoryId !== "all" ? categoryId : undefined,
          }),
        });

        if (!apiResponse.ok) {
          console.log(
            `API endpoint failed, trying fallback to /db/inventory...`
          );

          // Try fallback to db endpoint if API endpoint fails
          const fallbackResponse = await fetch("/db/inventory", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "getAll",
              categoryId: categoryId !== "all" ? categoryId : undefined,
            }),
          });

          if (!fallbackResponse.ok) {
            throw new Error("Failed to fetch inventory items");
          }

          const data = await fallbackResponse.json();
          console.log("Received inventory data from fallback endpoint:", data);

          // Handle different response formats
          const itemsArray = data.items || data;
          setItems(ensureArray(itemsArray));
          setFilteredItems(ensureArray(itemsArray));
        } else {
          const data = await apiResponse.json();
          console.log("Received inventory data from API endpoint:", data);

          // Handle different response formats
          const itemsArray = data.items || data;
          setItems(ensureArray(itemsArray));
          setFilteredItems(ensureArray(itemsArray));
        }
      } else {
        const data = await response.json();
        console.log(
          "Received inventory data from Netlify function endpoint:",
          data
        );

        // Handle different response formats
        const itemsArray = data.items || data;
        setItems(ensureArray(itemsArray));
        setFilteredItems(ensureArray(itemsArray));
      }
    } catch (err) {
      console.error("Error fetching inventory items:", err);

      // Use mock data instead of showing an error
      console.log("Using mock data as fallback due to error");
      const mockData = getMockInventoryData();

      // Filter by category if needed
      let filteredMockData = mockData;
      if (categoryId && categoryId !== "all") {
        filteredMockData = safeFilter(
          mockData,
          (item) => String(item.categoryId) === String(categoryId)
        );
      }

      setItems(ensureArray(filteredMockData));
      setFilteredItems(ensureArray(filteredMockData));

      // Set the flag to indicate we're using mock data
      setUsingMockData(true);

      // Don't show error to the user since we're showing mock data
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryItems(selectedCategory);
  }, [selectedCategory]);

  // Filter items when search term or category changes
  useEffect(() => {
    let result = items;

    // Debug logging to see what's happening
    console.log("Items:", items);
    console.log("Selected Category:", selectedCategory);
    if (items.length > 0) {
      console.log(
        "Sample item:",
        items[0],
        "categoryId:",
        items[0].categoryId || (items[0].category && items[0].category.id)
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      // Handle both formats: item.categoryId and item.category.id
      result = result.filter((item) => {
        const itemCategoryId =
          item.categoryId || (item.category && item.category.id);
        return String(itemCategoryId) === String(selectedCategory);
      });
      console.log("Filtered items count:", result.length);
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

  const addToCart = (item: InventoryItem) => {
    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      // Update quantity if item already in cart
      setCartItems(
        cartItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      // Add new item to cart
      setCartItems([
        ...cartItems,
        {
          id: String(item.id),
          name: item.name,
          quantity: 1,
        },
      ]);
    }

    // Show a brief notification
    alert(`Added ${item.name} to cart`);
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const handleRequestItems = () => {
    // Store the cart items in localStorage
    localStorage.setItem("pendingRequestItems", JSON.stringify(cartItems));

    // Navigate to the new request page
    navigate("/requests/new", {
      state: {
        cartItems: cartItems,
      },
    });
  };

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
      available: getQuantityAvailable(item),
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
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Browse Items</h1>

          <div className="relative">
            <Button
              onClick={() => setShowCart(!showCart)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ShoppingCart size={18} />
              <span>Cart ({cartItems.length})</span>
            </Button>

            {/* Cart dropdown */}
            {showCart && cartItems.length > 0 && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border border-neutral-200">
                <div className="p-3">
                  <h3 className="font-medium mb-2">Request Cart</h3>
                  <div className="max-h-60 overflow-y-auto">
                    {safeMap(cartItems, (item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center py-2 border-b border-neutral-100"
                      >
                        <div>
                          <p className="text-sm">{item.name}</p>
                          <p className="text-xs text-neutral-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-error-500 hover:text-error-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleRequestItems}
                    className="w-full mt-3"
                    size="sm"
                  >
                    Request All Items
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

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
              <Filter className="mr-2 text-neutral-500" size={16} />
              <span className="text-sm font-medium text-neutral-700">
                Filter by Category
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedCategory === "all"
                    ? "bg-primary-500 text-white shadow-3d-sm"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                All Items
              </button>

              {/* Show actual categories from the database */}
              {safeMap(categories, (category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    console.log(
                      "Setting category ID:",
                      category.id,
                      "type:",
                      typeof category.id
                    );

                    // Set the selected category - this will trigger the useEffect to fetch items
                    setSelectedCategory(String(category.id));
                  }}
                  className={`px-3 py-1 text-sm rounded-full ${
                    String(selectedCategory) === String(category.id)
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

        {/* Mock Data Notice */}
        {usingMockData && (
          <MockDataNotice
            onRetry={() => fetchInventoryItems(selectedCategory)}
          />
        )}

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
              onClick={() => fetchInventoryItems(selectedCategory)}
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
            {safeMap(filteredItems, (item) => (
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
                    <div className="mt-2 flex items-center">
                      <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full">
                        {item.categoryName ||
                          (item.category && item.category.name) ||
                          "Uncategorized"}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-neutral-500">Available</p>
                        <p className="text-sm font-medium">
                          {getQuantityAvailable(item)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => addToCart(item)}
                          disabled={getQuantityAvailable(item) <= 0}
                          size="sm"
                          variant="outline"
                          className="shadow-3d-sm hover:shadow-3d-md transition-all"
                        >
                          Add to Cart
                        </Button>
                        <Button
                          onClick={() => handleRequestItem(item)}
                          disabled={getQuantityAvailable(item) <= 0}
                          size="sm"
                          className="shadow-3d-sm hover:shadow-3d-md transition-all"
                        >
                          Request
                        </Button>
                      </div>
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
