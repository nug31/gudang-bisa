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
  getAll: async (): Promise<ItemRequest[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/requests`);
      return handleResponse(response);
    } catch (error) {
      console.error("Error fetching requests:", error);
      // Fallback to direct database connection if API fails
      return requestDbApi.getAll();
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
  getAll: async (): Promise<ItemRequest[]> => {
    try {
      const response = await fetch("/db/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getAll",
        }),
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Error fetching requests from database:", error);
      throw error;
    }
  },

  // Get a request by ID
  getById: async (id: string): Promise<ItemRequest> => {
    try {
      const response = await fetch("/db/requests", {
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
    const maxRetries = 2;
    let retryCount = 0;
    let lastError: any = null;

    while (retryCount <= maxRetries) {
      try {
        const now = new Date().toISOString();
        const newRequest = {
          ...request,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        };

        console.log(`Attempt ${retryCount + 1} to create request:`, newRequest);

        const response = await fetch("/db/requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            request: newRequest,
          }),
        });

        // Check if response is empty
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn("Server did not return JSON. Status:", response.status);
          if (response.ok) {
            // If the response is OK but not JSON, create a mock response
            console.log(
              "Server returned success but no JSON, using request data as response"
            );
            return newRequest as ItemRequest;
          }
          throw new Error(
            `Server returned non-JSON response: ${response.status} ${response.statusText}`
          );
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error response:", errorText);
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }

        try {
          return await handleResponse(response);
        } catch (parseError) {
          console.error(
            "Failed to parse response, using request data as fallback"
          );
          // If we can't parse the response but the request was successful, return the request data
          if (response.ok) {
            return newRequest as ItemRequest;
          }
          throw parseError;
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
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
          console.log(
            `Retrying request creation (attempt ${retryCount + 1})...`
          );
        }
      }
    }

    console.error(`Failed to create request after ${maxRetries + 1} attempts`);
    throw (
      lastError || new Error("Failed to create request after multiple attempts")
    );
  },

  // Update a request
  update: async (request: ItemRequest): Promise<ItemRequest> => {
    try {
      console.log("requestDbApi: Updating request:", request);

      const updatedRequest = {
        ...request,
        updatedAt: new Date().toISOString(),
      };

      console.log(
        "requestDbApi: Prepared request with updated timestamp:",
        updatedRequest
      );

      const response = await fetch("/db/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          request: updatedRequest,
        }),
      });

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
      const response = await fetch("/db/requests", {
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

      const response = await fetch("/db/requests", {
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
