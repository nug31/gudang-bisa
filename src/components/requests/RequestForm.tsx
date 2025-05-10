import React, { useState, FormEvent, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Calendar,
  AlertTriangle,
  Boxes,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ItemRequest } from "../../types";
import { useRequests } from "../../context/RequestContext";
import { useAuth } from "../../context/AuthContext";
import { useCategories } from "../../context/CategoryContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Select } from "../ui/Select";

// Import the InventoryItem type
import { InventoryItem } from "../../types/inventory";
import {
  safeParseSearchParams,
  safeFind,
  safeMap,
} from "../../utils/polyfillHelpers";

interface RequestFormProps {
  initialData?: Partial<ItemRequest>;
  isEdit?: boolean;
}

interface RequestItem {
  id: string;
  name: string;
  quantity: number;
  available: number;
}

export const RequestForm: React.FC<RequestFormProps> = ({
  initialData = {},
  isEdit = false,
}) => {
  const { user } = useAuth();
  const { createRequest, updateRequest, message, clearMessage } = useRequests();
  const { categories } = useCategories();
  const navigate = useNavigate();
  const location = useLocation();

  // Get itemId directly from URL query parameters as a backup
  let itemIdFromUrl = null;
  try {
    // First try the standard URLSearchParams
    try {
      const searchParams = new URLSearchParams(location.search);
      itemIdFromUrl = searchParams.get("itemId");
    } catch (urlError) {
      console.warn(
        "URLSearchParams failed in RequestForm, using fallback parser:",
        urlError
      );
      // Fallback to our safe parser
      const params = safeParseSearchParams(location.search);
      itemIdFromUrl = params.itemId || null;
    }
  } catch (error) {
    console.error("Error parsing URL search params in RequestForm:", error);
  }

  // Log for debugging
  console.log("RequestForm - initialData:", initialData);
  console.log("RequestForm - itemIdFromUrl:", itemIdFromUrl);

  const [formData, setFormData] = useState({
    projectName: initialData.title || "",
    description: initialData.description || "",
    priority: initialData.priority || "medium",
    dueDate: initialData.fulfillmentDate
      ? new Date(initialData.fulfillmentDate).toISOString().split("T")[0]
      : "",
  });

  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedItemQuantity, setSelectedItemQuantity] = useState<number>(1);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Fetch all inventory items on component mount
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        console.log("Fetching inventory items in RequestForm...");
        console.log("Initial data:", initialData);

        // Check if we have request items in the initialData (from cart)
        if (
          initialData.requestItems &&
          Array.isArray(initialData.requestItems)
        ) {
          console.log(
            "Using request items from initialData:",
            initialData.requestItems
          );
          setRequestItems(initialData.requestItems);
        }
        // Otherwise check if we have a pending request item in localStorage
        else {
          const pendingItemJson = localStorage.getItem("pendingRequestItem");
          console.log(
            "Pending request item from localStorage:",
            pendingItemJson
          );

          // If we have a pending item, use it directly
          if (pendingItemJson) {
            try {
              const pendingItem = JSON.parse(pendingItemJson);
              console.log("Parsed pending item:", pendingItem);

              // Add the pending item to the request items list
              setRequestItems([pendingItem]);

              // Clear the pending item from localStorage
              localStorage.removeItem("pendingRequestItem");

              console.log("Added pending item to request items");
            } catch (e) {
              console.error("Error parsing pending item:", e);
            }
          }
        }

        // First try the db endpoint
        try {
          console.log("Trying to fetch inventory items from /db/inventory...");
          const response = await fetch("/db/inventory", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "getAll",
            }),
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log("Response from /db/inventory:", responseData);

            // Check if the response has an items array (new format) or is an array itself (old format)
            let items = [];
            if (
              responseData &&
              responseData.items &&
              Array.isArray(responseData.items)
            ) {
              console.log(
                `Successfully fetched ${responseData.items.length} inventory items from /db/inventory (new format)`
              );
              items = responseData.items;
            } else if (Array.isArray(responseData)) {
              console.log(
                `Successfully fetched ${responseData.length} inventory items from /db/inventory (old format)`
              );
              items = responseData;
            } else {
              console.warn(
                "Unexpected response format from /db/inventory:",
                responseData
              );
              throw new Error("Unexpected response format");
            }

            if (items.length > 0) {
              console.log("Sample item:", items[0]);
              setInventoryItems(items);
              // Process the data for any initial items
              processInitialItems(items);
              return;
            } else {
              console.warn("No items returned from /db/inventory");
              throw new Error("No items returned");
            }
          } else {
            console.warn(
              "Response from /db/inventory not OK:",
              response.status
            );
            throw new Error(`HTTP error: ${response.status}`);
          }
        } catch (dbError) {
          console.error("Error fetching from /db/inventory:", dbError);
        }

        // If db endpoint fails, try the API endpoint
        try {
          console.log("Trying to fetch inventory items from /api/inventory...");
          const apiResponse = await fetch("/api/inventory", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "getAll",
            }),
          });

          if (apiResponse.ok) {
            const apiResponseData = await apiResponse.json();
            console.log("Response from /api/inventory:", apiResponseData);

            // Check if the response has an items array (new format) or is an array itself (old format)
            let items = [];
            if (
              apiResponseData &&
              apiResponseData.items &&
              Array.isArray(apiResponseData.items)
            ) {
              console.log(
                `Successfully fetched ${apiResponseData.items.length} inventory items from /api/inventory (new format)`
              );
              items = apiResponseData.items;
            } else if (Array.isArray(apiResponseData)) {
              console.log(
                `Successfully fetched ${apiResponseData.length} inventory items from /api/inventory (old format)`
              );
              items = apiResponseData;
            } else {
              console.warn(
                "Unexpected response format from /api/inventory:",
                apiResponseData
              );
              throw new Error("Unexpected response format");
            }

            if (items.length > 0) {
              console.log("Sample item:", items[0]);
              setInventoryItems(items);
              // Process the data for any initial items
              processInitialItems(items);
              return;
            } else {
              console.warn("No items returned from /api/inventory");
              throw new Error("No items returned");
            }
          } else {
            console.warn(
              "Response from /api/inventory not OK:",
              apiResponse.status
            );
            throw new Error(`HTTP error: ${apiResponse.status}`);
          }
        } catch (apiError) {
          console.error("Error fetching from /api/inventory:", apiError);
        }

        // Try the Neon endpoint directly as a last resort
        try {
          console.log(
            "Trying to fetch inventory items from /neon/inventory..."
          );
          const neonResponse = await fetch("/neon/inventory", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "getAll",
            }),
          });

          if (neonResponse.ok) {
            const neonResponseData = await neonResponse.json();
            console.log("Response from /neon/inventory:", neonResponseData);

            // Check if the response has an items array (new format) or is an array itself (old format)
            let items = [];
            if (
              neonResponseData &&
              neonResponseData.items &&
              Array.isArray(neonResponseData.items)
            ) {
              console.log(
                `Successfully fetched ${neonResponseData.items.length} inventory items from /neon/inventory (new format)`
              );
              items = neonResponseData.items;
            } else if (Array.isArray(neonResponseData)) {
              console.log(
                `Successfully fetched ${neonResponseData.length} inventory items from /neon/inventory (old format)`
              );
              items = neonResponseData;
            } else {
              console.warn(
                "Unexpected response format from /neon/inventory:",
                neonResponseData
              );
              throw new Error("Unexpected response format");
            }

            if (items.length > 0) {
              console.log("Sample item:", items[0]);
              setInventoryItems(items);
              // Process the data for any initial items
              processInitialItems(items);
              return;
            } else {
              console.warn("No items returned from /neon/inventory");
              throw new Error("No items returned");
            }
          } else {
            console.warn(
              "Response from /neon/inventory not OK:",
              neonResponse.status
            );
            throw new Error(`HTTP error: ${neonResponse.status}`);
          }
        } catch (neonError) {
          console.error("Error fetching from /neon/inventory:", neonError);
        }

        // If all endpoints fail, use mock data
        console.log("All endpoints failed, using mock inventory data");
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
            quantityAvailable: 20,
            quantityReserved: 0,
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

        console.log(`Using ${mockData.length} mock inventory items`);
        setInventoryItems(mockData);

        // Process the data for any initial items
        processInitialItems(mockData);
      } catch (error) {
        console.error("Error in fetchInventoryItems:", error);

        // Last resort mock data
        const fallbackMockData = [
          {
            id: "1",
            name: "Office Supplies",
            description: "General office supplies",
            categoryId: "1",
            categoryName: "Office",
            quantityAvailable: 100,
            quantityReserved: 0,
          },
          {
            id: "2",
            name: "Cleaning Supplies",
            description: "General cleaning supplies",
            categoryId: "2",
            categoryName: "Cleaning",
            quantityAvailable: 50,
            quantityReserved: 0,
          },
        ];

        console.log("Using fallback mock data as last resort");
        setInventoryItems(fallbackMockData);

        // Process the data for any initial items
        processInitialItems(fallbackMockData);
      }
    };

    // Helper function to process initial items
    const processInitialItems = (data: InventoryItem[]) => {
      // If we already added an item from localStorage, we're done
      const pendingItemJson = localStorage.getItem("pendingRequestItem");
      if (pendingItemJson) {
        return;
      }

      try {
        // Get the item ID from initialData or from URL
        const inventoryItemId =
          (initialData as any).inventoryItemId || itemIdFromUrl;
        console.log("Inventory item ID to use:", inventoryItemId);

        if (inventoryItemId) {
          console.log("Looking for item with ID:", inventoryItemId);
          // Safely convert data to array if it's not already
          const itemsArray = Array.isArray(data) ? data : [];

          // Use safe find method that doesn't rely on array methods that might be affected by polyfills
          let foundItem: InventoryItem | undefined;
          for (let i = 0; i < itemsArray.length; i++) {
            if (String(itemsArray[i].id) === String(inventoryItemId)) {
              foundItem = itemsArray[i];
              break;
            }
          }

          if (foundItem) {
            console.log("Found item:", foundItem.name);
            // Add the item to the request items list
            const newRequestItem = {
              id: foundItem.id,
              name: foundItem.name,
              quantity: 1,
              available: foundItem.quantityAvailable,
            };
            console.log("Adding item to request items:", newRequestItem);
            setRequestItems([newRequestItem]);

            // No need to auto-select the item in the dropdown since we've already added it
            setSelectedItemId("");
          } else {
            console.error("Item not found with ID:", inventoryItemId);
            console.log(
              "Available items:",
              itemsArray.map((i) => ({ id: i.id, name: i.name }))
            );
          }
        }
      } catch (error) {
        console.error("Error in processInitialItems:", error);
      }
    };

    fetchInventoryItems();
  }, [initialData, itemIdFromUrl]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectName.trim()) {
      newErrors.projectName = "Project name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Reason/Description is required";
    }

    if (requestItems.length === 0) {
      newErrors.items = "At least one item must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numberValue = value === "" ? 1 : Number(value);

    // Get the selected item to check available stock
    if (selectedItemId) {
      const selectedItem = inventoryItems.find(
        (item) => item.id === selectedItemId
      );
      if (selectedItem && numberValue > selectedItem.quantityAvailable) {
        // If quantity exceeds available stock, show error but don't update the value
        setErrors((prev) => ({
          ...prev,
          quantity: `Exceeds available stock (${selectedItem.quantityAvailable})`,
        }));
        return;
      }
    }

    // Clear any quantity error
    if (errors.quantity) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.quantity;
        return newErrors;
      });
    }

    setSelectedItemQuantity(numberValue);

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      priority: value as ItemRequest["priority"],
    }));
  };

  const handleItemChange = (value: string) => {
    setSelectedItemId(value);
  };

  const handleAddItem = () => {
    if (!selectedItemId) return;

    const selectedItem = inventoryItems.find(
      (item) => item.id === selectedItemId
    );
    if (!selectedItem) return;

    // Check if the requested quantity exceeds available stock
    if (selectedItemQuantity > selectedItem.quantityAvailable) {
      setErrors((prev) => ({
        ...prev,
        quantity: `Exceeds available stock (${selectedItem.quantityAvailable})`,
      }));
      return;
    }

    // Check if adding to an existing item would exceed available stock
    const existingItem = requestItems.find(
      (item) => item.id === selectedItemId
    );
    if (existingItem) {
      const newQuantity = existingItem.quantity + selectedItemQuantity;
      if (newQuantity > selectedItem.quantityAvailable) {
        setErrors((prev) => ({
          ...prev,
          quantity: `Total quantity (${newQuantity}) exceeds available stock (${selectedItem.quantityAvailable})`,
        }));
        return;
      }
    }

    // Check if item already exists in the list
    if (requestItems.some((item) => item.id === selectedItemId)) {
      // Update quantity instead of adding a new item
      setRequestItems((prev) =>
        prev.map((item) =>
          item.id === selectedItemId
            ? { ...item, quantity: item.quantity + selectedItemQuantity }
            : item
        )
      );
    } else {
      // Add new item
      setRequestItems((prev) => [
        ...prev,
        {
          id: selectedItem.id,
          name: selectedItem.name,
          quantity: selectedItemQuantity,
          available: selectedItem.quantityAvailable,
        },
      ]);
    }

    // Reset selection
    setSelectedItemId("");
    setSelectedItemQuantity(1);

    // Clear any errors
    if (errors.items || errors.quantity) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.items;
        delete newErrors.quantity;
        return newErrors;
      });
    }
  };

  const handleRemoveItem = (id: string) => {
    setRequestItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Find the item in the request list
    const requestItem = requestItems.find((item) => item.id === id);
    if (!requestItem) return;

    // Check if the new quantity exceeds available stock
    if (newQuantity > requestItem.available) {
      // Show error message
      setErrors((prev) => ({
        ...prev,
        items: `Quantity for ${requestItem.name} exceeds available stock (${requestItem.available})`,
      }));
      return;
    }

    // Clear any item-related errors
    if (errors.items) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.items;
        return newErrors;
      });
    }

    setRequestItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
    saveAsDraft = false
  ) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const status = saveAsDraft
        ? "draft"
        : isEdit
        ? initialData.status
        : "pending";

      // Make sure we have a valid user ID
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Log the form data for debugging
      console.log("Submitting form data:", formData);
      console.log("Request items:", requestItems);

      // Check if any items exceed available stock
      const invalidItems = requestItems.filter(
        (item) => item.quantity > item.available
      );

      if (invalidItems.length > 0) {
        setErrors({
          items: `Some items exceed available stock: ${invalidItems
            .map((item) => item.name)
            .join(", ")}`,
        });
        setIsSubmitting(false);
        return;
      }

      // Create a request for each item
      const createdRequests = [];
      const failedItems = [];
      let hasError = false;

      // Process items sequentially to avoid overwhelming the server
      for (const item of requestItems) {
        try {
          // Find the inventory item to get its category
          const inventoryItem = inventoryItems.find(
            (inv) => inv.id === item.id
          );

          // Prepare the request data with all necessary fields
          const requestData = {
            ...initialData,
            title: formData.projectName || `Request for ${item.name}`,
            description: formData.description,
            priority: formData.priority as ItemRequest["priority"],
            quantity: item.quantity,
            fulfillmentDate: formData.dueDate || undefined,
            status: status as ItemRequest["status"],
            userId: user.id,
            // These fields are required by the Netlify function
            itemId: item.id,
            // Keep the additional fields for compatibility with other parts of the app
            inventoryItemId: item.id,
            inventoryItemName: item.name,
            reason: formData.description, // Pass the description as the reason
            // Use the category from the inventory item or a default category
            category: initialData.category || "office", // Default to office category
            categoryId:
              initialData.categoryId ||
              (inventoryItem ? inventoryItem.categoryId : categories[0]?.id), // Use the first category as fallback
          };

          // Log the request data for debugging
          console.log("Request data to be submitted:", requestData);

          // Add a delay between requests to avoid overwhelming the server
          if (createdRequests.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          let result;
          try {
            console.log(
              `Attempting to ${isEdit ? "update" : "create"} request for ${
                item.name
              }...`
            );

            if (isEdit && initialData.id) {
              console.log(
                `Updating existing request with ID ${initialData.id}`
              );
              result = await updateRequest(requestData as ItemRequest);
            } else {
              console.log(
                `Creating new request for item ${item.name} with ID ${item.id}`
              );

              // Add more debugging for the request data
              console.log("Request data being sent to API:", {
                ...requestData,
                userId: requestData.userId,
                itemId: requestData.itemId,
                inventoryItemId: requestData.inventoryItemId,
                categoryId: requestData.categoryId,
              });

              // Check if we have all required fields
              const missingFields = [];
              if (!requestData.userId) missingFields.push("userId");
              if (!requestData.itemId && !requestData.inventoryItemId)
                missingFields.push("itemId/inventoryItemId");
              if (!requestData.title) missingFields.push("title");
              if (!requestData.description) missingFields.push("description");

              if (missingFields.length > 0) {
                console.error(
                  `Missing required fields: ${missingFields.join(", ")}`
                );
              }

              result = await createRequest(requestData);
            }

            if (result) {
              console.log(
                `Request for ${item.name} created successfully:`,
                result
              );
              createdRequests.push(result);
            } else {
              console.error(`No result returned for ${item.name}`);
              failedItems.push(item.name);
              hasError = true;
            }
          } catch (requestError) {
            console.error(
              `Error creating request for item ${item.name}:`,
              requestError
            );

            // Log more details about the error
            if (requestError instanceof Error) {
              console.error(`Error message: ${requestError.message}`);
              console.error(`Error stack: ${requestError.stack}`);
            }

            failedItems.push(item.name);
            hasError = true;

            // If this is a server error, we might want to stop processing
            if (
              requestError instanceof Error &&
              requestError.message.includes("Server error: 500")
            ) {
              console.error(
                "Critical server error detected, stopping processing"
              );
              throw requestError;
            }
          }
        } catch (itemError) {
          console.error(`Error processing item ${item.name}:`, itemError);
          failedItems.push(item.name);
          hasError = true;

          // If this is a critical error, stop processing
          if (
            itemError instanceof Error &&
            (itemError.message.includes("not authenticated") ||
              itemError.message.includes("Server error: 500"))
          ) {
            throw itemError;
          }
        }
      }

      if (hasError && createdRequests.length === 0) {
        // If all requests failed, show error
        throw new Error(
          `Failed to create any requests. Please try again. Failed items: ${failedItems.join(
            ", "
          )}`
        );
      } else if (hasError) {
        // If some requests succeeded but others failed
        const message = `Some items could not be added to your request: ${failedItems.join(
          ", "
        )}. The others were successfully submitted.`;
        console.warn(message);
        alert(message);
      }

      // Show success message
      console.log(
        "Request submitted successfully, navigating to requests page"
      );

      // Store the target URL for navigation
      const targetUrl =
        isEdit && initialData.id ? `/requests/${initialData.id}` : "/requests";

      console.log(`Will navigate to ${targetUrl} after alert`);

      try {
        // Show success message to user
        if (createdRequests.length > 0) {
          window.alert(
            hasError
              ? `Your request has been partially submitted. ${failedItems.length} item(s) failed.`
              : "Your request has been submitted successfully!"
          );
        }

        // Navigate immediately after alert is dismissed
        console.log(`Navigating to ${targetUrl}`);
        navigate(targetUrl, { replace: true });

        // Add a fallback direct location change in case navigate fails
        setTimeout(() => {
          if (window.location.pathname !== targetUrl) {
            console.log("Fallback navigation with window.location");
            window.location.href = targetUrl;
          }
        }, 100);
      } catch (navError) {
        console.error("Navigation error:", navError);
        // Last resort fallback
        window.location.href = targetUrl;
      }
    } catch (error) {
      console.error("Error submitting request:", error);

      // Show a more user-friendly error message
      let errorMessage =
        "An unexpected error occurred. Please try again or contact support.";

      if (error instanceof Error) {
        if (error.message.includes("Server error: 500")) {
          errorMessage =
            "The server encountered an internal error. This might be due to database connectivity issues. Please try again later.";
        } else if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          errorMessage =
            "Network error: Please check your internet connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      alert(`Failed to submit request: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed unused handleSaveAsDraft function

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ];

  // Create inventory item options for the dropdown
  const inventoryItemOptions = [
    { value: "", label: "Select an item..." },
    ...safeMap(Array.isArray(inventoryItems) ? inventoryItems : [], (item) => {
      // Make sure we have a valid item with required properties
      if (!item || !item.id || !item.name) {
        console.warn("Invalid inventory item in dropdown:", item);
        return null;
      }

      // Get the quantity available, handling different property names
      const quantityAvailable =
        typeof item.quantityAvailable === "number"
          ? item.quantityAvailable
          : typeof item.quantity_available === "number"
          ? item.quantity_available
          : typeof item.quantity === "number"
          ? item.quantity
          : 0;

      return {
        value: item.id,
        label: `${item.name} (${quantityAvailable} available)`,
      };
    }).filter(Boolean), // Filter out any null items
  ];

  return (
    <form
      id="request-form"
      onSubmit={(e) => handleSubmit(e, false)}
      className="bg-white rounded-lg shadow-card p-6 max-w-3xl mx-auto animate-fade-in"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900 flex items-center">
          <Boxes className="mr-2 h-6 w-6 text-primary-500" />
          {isEdit ? "Edit Order" : "New Inventory Order"}
        </h2>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-medium text-neutral-900">Order Details</h3>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-md flex items-start ${
            message.type === "warning"
              ? "bg-warning-50 border border-warning-200"
              : message.type === "error"
              ? "bg-error-50 border border-error-200"
              : "bg-success-50 border border-success-200"
          }`}
        >
          {message.type === "warning" && (
            <AlertTriangle className="h-5 w-5 text-warning-500 mr-3 mt-0.5" />
          )}
          {message.type === "error" && (
            <XCircle className="h-5 w-5 text-error-500 mr-3 mt-0.5" />
          )}
          {message.type === "success" && (
            <CheckCircle className="h-5 w-5 text-success-500 mr-3 mt-0.5" />
          )}
          {message.type === "info" && (
            <Info className="h-5 w-5 text-info-500 mr-3 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`text-sm ${
                message.type === "warning"
                  ? "text-warning-700"
                  : message.type === "error"
                  ? "text-error-700"
                  : message.type === "success"
                  ? "text-success-700"
                  : "text-info-700"
              }`}
            >
              {message.text}
            </p>
          </div>
          <button
            type="button"
            onClick={clearMessage}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        <Input
          label="Project Name *"
          name="projectName"
          value={formData.projectName}
          onChange={handleInputChange}
          error={errors.projectName}
          placeholder="e.g., Smart Home Prototype"
          required
        />

        <Textarea
          label="Reason / Description *"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          error={errors.description}
          placeholder="Explain why you need these items and how they will be used"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Priority Level *"
            name="priority"
            value={formData.priority}
            onChange={handlePriorityChange}
            options={priorityOptions}
          />

          <Input
            label="Due Date (Optional)"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleInputChange}
            leftIcon={<Calendar className="h-4 w-4" />}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-neutral-700">
              Items *
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleAddItem}
              disabled={!selectedItemId}
            >
              Add Item
            </Button>
          </div>

          {errors.items && (
            <p className="mt-1 mb-2 text-sm text-error-500">{errors.items}</p>
          )}

          <div className="flex space-x-2 mb-2">
            <div className="flex-1">
              <Select
                value={selectedItemId}
                onChange={handleItemChange}
                options={inventoryItemOptions}
              />
            </div>
            <div className="w-24">
              <Input
                type="number"
                min="1"
                value={selectedItemQuantity}
                onChange={handleNumberInputChange}
                error={errors.quantity}
              />
            </div>
          </div>
          {errors.quantity && (
            <p className="mt-1 mb-2 text-sm text-error-500">
              {errors.quantity}
            </p>
          )}

          {requestItems.length > 0 ? (
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              {requestItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border-b border-neutral-200 last:border-b-0"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm">
                      {item.quantity > item.available ? (
                        <span className="text-error-500 font-medium flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Exceeds available stock ({item.available})
                        </span>
                      ) : (
                        <span className="text-neutral-500">
                          {item.available} available
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center border border-neutral-200 rounded">
                      <button
                        type="button"
                        className="px-2 py-1 text-neutral-500 hover:bg-neutral-100"
                        onClick={() =>
                          handleItemQuantityChange(item.id, item.quantity - 1)
                        }
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        className={`px-2 py-1 ${
                          item.quantity >= item.available
                            ? "text-neutral-300 cursor-not-allowed"
                            : "text-neutral-500 hover:bg-neutral-100"
                        }`}
                        onClick={() =>
                          item.quantity < item.available &&
                          handleItemQuantityChange(item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.available}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-neutral-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-neutral-500 text-sm italic p-4 border border-dashed border-neutral-300 rounded-lg bg-neutral-50 text-center">
              No items added yet. Select an item from the dropdown and click
              "Add Item".
            </div>
          )}
        </div>

        {formData.priority === "critical" && (
          <div className="flex items-start p-4 bg-warning-50 border border-warning-200 rounded-md">
            <AlertTriangle className="h-5 w-5 text-warning-500 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-warning-800">
                Critical Priority Notice
              </h4>
              <p className="text-sm text-warning-700 mt-1">
                Critical priority requests will be expedited for review. Please
                ensure this is truly urgent.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={
            isSubmitting ||
            !!errors.items ||
            !!errors.quantity ||
            requestItems.some((item) => item.quantity > item.available)
          }
        >
          Submit Request
        </Button>
      </div>
    </form>
  );
};
