import { ItemRequest, Comment, User } from "../types";
import { v4 as uuidv4 } from "uuid";

// Base URL for API requests
const API_BASE_URL = "/api";

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || "An error occurred");
    } catch (jsonError) {
      // If JSON parsing fails, use the status text
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`
      );
    }
  }

  try {
    // First check if there's any content to parse
    const text = await response.text();
    if (!text) {
      console.log("Empty response from server, returning empty object");
      return {}; // Return empty object if no content
    }

    // Try to parse the text as JSON
    return JSON.parse(text);
  } catch (jsonError) {
    console.error("JSON parsing error:", jsonError);
    throw new Error("Failed to parse server response as JSON");
  }
};

// Request API service
export const requestApi = {
  // Get all requests
  getAll: async (timestamp?: number): Promise<ItemRequest[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests`);
      return handleResponse(response);
    } catch (error) {
      console.error("Error fetching requests:", error);
      // Fallback to direct database connection if API fails
      return requestDbApi.getAll(timestamp);
    }
  },

  // Get a request by ID
  getById: async (id: string): Promise<ItemRequest> => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests/${id}`);
      return handleResponse(response);
    } catch (error) {
      console.error(`Error fetching request ${id}:`, error);
      // Fallback to direct database connection if API fails
      return requestDbApi.getById(id);
    }
  },

  // Create a new request
  create: async (
    request: Omit<ItemRequest, "id" | "createdAt" | "updatedAt">
  ): Promise<ItemRequest> => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Error creating request:", error);
      // Fallback to direct database connection if API fails
      return requestDbApi.create(request);
    }
  },

  // Update a request
  update: async (request: ItemRequest): Promise<ItemRequest> => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests/${request.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error updating request ${request.id}:`, error);
      // Fallback to direct database connection if API fails
      return requestDbApi.update(request);
    }
  },

  // Delete a request
  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
        method: "DELETE",
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error deleting request ${id}:`, error);
      // Fallback to direct database connection if API fails
      return requestDbApi.delete(id);
    }
  },

  // Add a comment to a request
  addComment: async (
    requestId: string,
    userId: string,
    content: string
  ): Promise<Comment> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/requests/${requestId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, content }),
        }
      );
      return handleResponse(response);
    } catch (error) {
      console.error(`Error adding comment to request ${requestId}:`, error);
      // Fallback to direct database connection if API fails
      return requestDbApi.addComment(requestId, userId, content);
    }
  },
};

// Direct database connection API (fallback)
export const requestDbApi = {
  // Get all requests
  getAll: async (timestamp?: number): Promise<ItemRequest[]> => {
    try {
      console.log(
        `Fetching all requests with timestamp: ${timestamp || "none"}`
      );

      const response = await fetch("/.netlify/functions/neon-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({
          action: "getAll",
          timestamp: timestamp || new Date().getTime(), // Add timestamp to prevent caching
        }),
      });

      console.log(`Request response status: ${response.status}`);

      const responseData = await handleResponse(response);

      // Handle both formats: array or {requests: array}
      const requests = responseData.requests || responseData;

      console.log(`Received ${requests.length} requests from server`);
      console.log("Response format:", responseData);

      return requests;
    } catch (error) {
      console.error("Error fetching requests from database:", error);
      throw error;
    }
  },

  // Get a request by ID
  getById: async (id: string): Promise<ItemRequest> => {
    try {
      const response = await fetch("/.netlify/functions/neon-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getById",
          id,
        }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error fetching request ${id} from database:`, error);
      throw error;
    }
  },

  // Create a new request
  create: async (
    request: Omit<ItemRequest, "id" | "createdAt" | "updatedAt">
  ): Promise<ItemRequest> => {
    const maxRetries = 3; // Increased from 2 to 3
    let retryCount = 0;
    let lastError: any = null;
    let lastResponse: Response | null = null;

    // Create a complete request object that can be used as a fallback
    const now = new Date().toISOString();
    const newRequest = {
      ...request,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    console.log("=== REQUEST CREATION STARTED ===");
    console.log("Original request data:", request);
    console.log("Complete request object with ID and timestamps:", newRequest);

    while (retryCount <= maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} to create request:`, newRequest);

        // Make sure we have all required fields
        if (!newRequest.userId) {
          console.error("Missing userId in request data");
          throw new Error("User ID is required for creating a request");
        }

        if (!newRequest.itemId && !newRequest.inventoryItemId) {
          console.error("Missing itemId/inventoryItemId in request data");
          throw new Error("Item ID is required for creating a request");
        }

        // Log the request body for debugging
        const requestBody = {
          action: "create",
          // Include the required fields directly at the top level for the Netlify function
          userId: newRequest.userId,
          itemId: newRequest.itemId || newRequest.inventoryItemId,
          quantity: newRequest.quantity || 1,
          reason: newRequest.reason || newRequest.description,
          // Also include the full request object for compatibility
          request: newRequest,
          timestamp: Date.now(), // Add timestamp to prevent caching
        };
        console.log(
          "Request body being sent to server:",
          JSON.stringify(requestBody)
        );

        console.log("Sending request to /.netlify/functions/neon-requests");

        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        let response;
        try {
          response = await fetch("/.netlify/functions/neon-requests", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
            // Add credentials to ensure cookies are sent
            credentials: "include",
          });

          // Clear the timeout since the request completed
          clearTimeout(timeoutId);
        } catch (fetchError) {
          // Clear the timeout to prevent memory leaks
          clearTimeout(timeoutId);

          // Check if the error was due to timeout
          if (fetchError.name === "AbortError") {
            throw new Error(
              "Request timed out after 15 seconds. The server might be experiencing high load or connectivity issues."
            );
          }

          // Re-throw other errors
          throw fetchError;
        }

        lastResponse = response;
        console.log(`Server response status: ${response.status}`);

        // Log more details about the response
        console.log("Response headers:", response.headers);

        // Check if response is empty
        const contentType = response.headers.get("content-type");
        console.log("Response content type:", contentType);

        // Try to get the response text for debugging regardless of content type
        let responseText = "";
        try {
          responseText = await response.clone().text();
          console.log("Raw response text:", responseText);
        } catch (textError) {
          console.error("Could not read response text:", textError);
        }

        if (!contentType || !contentType.includes("application/json")) {
          console.warn("Server did not return JSON. Status:", response.status);
          if (response.ok) {
            // If the response is OK but not JSON, create a mock response
            console.log(
              "Server returned success but no JSON, using request data as response"
            );
            return newRequest as ItemRequest;
          }

          // We already tried to get the error details above
          const errorDetails = responseText;

          throw new Error(
            `Server returned non-JSON response: ${response.status} ${
              response.statusText
            }${errorDetails ? ` - ${errorDetails}` : ""}`
          );
        }

        if (!response.ok) {
          let errorData: any = {};
          try {
            // Try to parse the error response as JSON
            errorData = await response.json();
          } catch (jsonError) {
            // If it's not JSON, get the text
            try {
              const errorText = await response.text();
              console.error("Server error response (text):", errorText);
              throw new Error(
                `Server error: ${response.status} ${response.statusText} - ${errorText}`
              );
            } catch (textError) {
              console.error("Could not read error response:", textError);
              throw new Error(
                `Server error: ${response.status} ${response.statusText}`
              );
            }
          }

          console.error("Server error response (JSON):", errorData);
          throw new Error(
            `Server error: ${response.status} ${response.statusText} - ${
              errorData.message || errorData.error || JSON.stringify(errorData)
            }`
          );
        }

        try {
          console.log("Attempting to parse response as JSON");
          const data = await handleResponse(response);
          console.log("Request created successfully with data:", data);

          // Validate that we have a proper response with at least an ID
          if (!data || !data.id) {
            console.warn(
              "Response data is missing ID, using request data as fallback"
            );
            return newRequest as ItemRequest;
          }

          return data;
        } catch (parseError) {
          console.error(
            "Failed to parse response, using request data as fallback:",
            parseError
          );

          // If we can't parse the response but the request was successful, return the request data
          if (response.ok) {
            console.log("Using request data as fallback response");
            return newRequest as ItemRequest;
          }

          // Try to get more information about the error
          let errorText = "";
          try {
            errorText = await response.clone().text();
            console.error("Error response text:", errorText);
          } catch (textError) {
            console.error("Could not read error response text:", textError);
          }

          throw new Error(
            `Failed to parse response: ${parseError}. Response text: ${errorText}`
          );
        }
      } catch (error) {
        console.error(
          `Error creating request (attempt ${retryCount + 1}):`,
          error
        );
        lastError = error;
        retryCount++;

        if (retryCount <= maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = 1000 * Math.pow(2, retryCount - 1); // 1s, 2s, 4s, 8s
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          console.log(
            `Retrying request creation (attempt ${retryCount + 1})...`
          );
        }
      }
    }

    console.error(`Failed to create request after ${maxRetries + 1} attempts`);

    // If we have a response but couldn't process it, provide more detailed error
    if (lastResponse) {
      try {
        const responseText = await lastResponse.text();
        console.error("Last server response:", responseText);
        throw new Error(
          `Server returned status ${lastResponse.status} ${lastResponse.statusText}. Response: ${responseText}`
        );
      } catch (textError) {
        console.error("Could not read last response:", textError);
      }
    }

    // If all else fails, return a more detailed error
    throw (
      lastError ||
      new Error(
        `Failed to create request after ${
          maxRetries + 1
        } attempts. Check your network connection and try again.`
      )
    );
  },

  // Update a request
  update: async (request: ItemRequest): Promise<ItemRequest> => {
    try {
      console.log("requestDbApi: Updating request:", request);

      // Make sure user roles are preserved properly
      let updatedRequest = {
        ...request,
        updatedAt: new Date().toISOString(),
      };

      // Add debugging for user roles
      if (updatedRequest.approvedBy) {
        console.log("Approving with user ID:", updatedRequest.approvedBy);
        // Get user from localStorage as backup
        try {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            console.log("User from localStorage:", parsedUser);
            console.log("User role from localStorage:", parsedUser.role);
          }
        } catch (e) {
          console.error("Error getting user from localStorage:", e);
        }
      }

      console.log(
        "requestDbApi: Prepared request with updated timestamp:",
        updatedRequest
      );

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      let response;
      try {
        response = await fetch("/.netlify/functions/neon-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          body: JSON.stringify({
            action: "update",
            request: updatedRequest,
            timestamp: Date.now(), // Add timestamp to prevent caching
          }),
          signal: controller.signal,
          // Add credentials to ensure cookies are sent
          credentials: "include",
        });

        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
      } catch (fetchError) {
        // Clear the timeout to prevent memory leaks
        clearTimeout(timeoutId);

        // Check if the error was due to timeout
        if (fetchError.name === "AbortError") {
          throw new Error(
            "Request timed out after 15 seconds. The server might be experiencing high load or connectivity issues."
          );
        }

        // Re-throw other errors
        throw fetchError;
      }

      console.log("requestDbApi: Update response status:", response.status);

      const result = await handleResponse(response);
      console.log("requestDbApi: Update response data:", result);

      return result;
    } catch (error) {
      console.error(`Error updating request ${request.id} in database:`, error);
      throw error;
    }
  },

  // Delete a request
  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch("/.netlify/functions/neon-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          id,
        }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error deleting request ${id} from database:`, error);
      throw error;
    }
  },

  // Add a comment to a request
  addComment: async (
    requestId: string,
    userId: string,
    content: string
  ): Promise<Comment> => {
    try {
      const comment = {
        id: uuidv4(),
        requestId,
        userId,
        content,
        createdAt: new Date().toISOString(),
      };

      const response = await fetch("/.netlify/functions/neon-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "addComment",
          comment,
        }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error(
        `Error adding comment to request ${requestId} in database:`,
        error
      );
      throw error;
    }
  },
};

// User API service
export const userApi = {
  // Get a user by ID
  getById: async (id: string): Promise<User | null> => {
    try {
      const response = await fetch("/db/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getById",
          id,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`User with ID ${id} not found`);
          return null;
        }
        throw new Error(`Error fetching user ${id}: ${response.statusText}`);
      }

      return handleResponse(response);
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return null;
    }
  },

  // Get all users
  getAll: async (): Promise<User[]> => {
    try {
      const response = await fetch("/db/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getAll",
        }),
      });

      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
      }

      return handleResponse(response);
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },
};
