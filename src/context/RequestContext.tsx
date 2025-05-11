import React, {
  createContext,
  useContext,
  useState,
  useReducer,
  useEffect,
} from "react";
import { ItemRequest, Comment, User } from "../types";
import { itemRequests as mockRequests } from "../data/mockData";
import { useAuth } from "./AuthContext";
import { formatISO } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { requestDbApi, userApi } from "../services/api";
import {
  createNotification,
  createNotificationForRole,
} from "../services/notificationService";

type RequestAction =
  | { type: "INITIALIZE"; payload: ItemRequest[] }
  | { type: "CREATE_REQUEST"; payload: ItemRequest }
  | { type: "UPDATE_REQUEST"; payload: ItemRequest }
  | { type: "DELETE_REQUEST"; payload: string }
  | { type: "ADD_COMMENT"; payload: { requestId: string; comment: Comment } }
  | { type: "SET_MESSAGE"; payload: { type: string; text: string } };

type RequestContextType = {
  requests: ItemRequest[];
  userRequests: ItemRequest[];
  loading: boolean;
  refreshRequests: () => Promise<void>;
  lastRefreshed: Date;
  message: { type: string; text: string } | null;
  createRequest: (
    request: Omit<ItemRequest, "id" | "createdAt" | "updatedAt">
  ) => Promise<ItemRequest | undefined>;
  updateRequest: (request: ItemRequest) => Promise<ItemRequest | undefined>;
  deleteRequest: (id: string) => Promise<void>;
  addComment: (
    requestId: string,
    content: string
  ) => Promise<Comment | undefined>;
  getRequestById: (id: string) => Promise<ItemRequest | undefined>;
  clearMessage: () => void;
};

function requestReducer(
  state: ItemRequest[],
  action: RequestAction
): ItemRequest[] {
  switch (action.type) {
    case "INITIALIZE":
      return action.payload;
    case "CREATE_REQUEST":
      return [...state, action.payload];
    case "UPDATE_REQUEST":
      return state.map((request) =>
        request.id === action.payload.id ? action.payload : request
      );
    case "DELETE_REQUEST":
      return state.filter((request) => request.id !== action.payload);
    case "ADD_COMMENT":
      return state.map((request) => {
        if (request.id === action.payload.requestId) {
          const comments = request.comments || [];
          return {
            ...request,
            comments: [...comments, action.payload.comment],
            updatedAt: formatISO(new Date()),
          };
        }
        return request;
      });
    case "SET_MESSAGE":
      // This action doesn't modify the requests state, it's handled separately
      return state;
    default:
      return state;
  }
}

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [requests, originalDispatch] = useReducer(requestReducer, []);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Create a custom dispatch function that also handles messages
  const dispatch = (action: RequestAction) => {
    // Handle SET_MESSAGE action by updating the message state
    if (action.type === "SET_MESSAGE") {
      setMessage(action.payload);
    }

    // Forward the action to the original dispatch
    return originalDispatch(action);
  };

  // Function to refresh requests
  const refreshRequests = async (): Promise<ItemRequest[]> => {
    try {
      console.log("Refreshing requests...");

      // Add a timestamp to force a fresh request (avoid caching)
      const timestamp = new Date().getTime();
      console.log(`Adding timestamp to request: ${timestamp}`);

      // Set a timeout to prevent hanging requests
      const timeoutPromise = new Promise<ItemRequest[]>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timeout after 10 seconds"));
        }, 10000);
      });

      // Create the actual data fetch promise
      const fetchPromise = requestDbApi.getAll(timestamp);

      // Race the fetch against the timeout
      const data = await Promise.race([fetchPromise, timeoutPromise]);

      if (!data || !Array.isArray(data)) {
        console.error("Invalid data received from server:", data);
        return [];
      }

      console.log("Received data from server:", data);

      // Log detailed information about the received data
      console.log(
        `RequestContext: Received ${data.length} requests from server`
      );
      if (data.length > 0) {
        console.log("RequestContext: First request:", data[0]);
        console.log(
          "RequestContext: Request statuses:",
          data.map((r) => r.status)
        );
        console.log(
          "RequestContext: Request IDs:",
          data.map((r) => r.id)
        );
      } else {
        console.warn("RequestContext: No requests received from server");
      }

      // Update the state with the new data
      dispatch({ type: "INITIALIZE", payload: data });

      // Update the last refreshed timestamp
      const now = new Date();
      setLastRefreshed(now);

      console.log(
        `RequestContext: Refreshed ${
          data.length
        } requests at ${now.toLocaleTimeString()}`
      );

      return data;
    } catch (error) {
      console.error("Error refreshing requests:", error);

      // Show a message to the user if there's a connection issue
      if (
        error instanceof Error &&
        (error.message.includes("timeout") ||
          error.message.includes("network") ||
          error.message.includes("connection"))
      ) {
        dispatch({
          type: "SET_MESSAGE",
          payload: {
            type: "warning",
            text: "Having trouble connecting to the server. Your changes may not be saved.",
          },
        });
      }

      return [];
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    refreshRequests();

    // Set up polling interval (every 10 seconds)
    const interval = setInterval(() => {
      refreshRequests();
    }, 10000); // 10 seconds

    setPollingInterval(interval);

    // Clean up interval on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  // Filter requests based on user role
  const userRequests = user
    ? user.role === "admin" || user.role === "manager"
      ? requests // Admin and manager can see all requests
      : requests.filter((request) => request.userId === user.id) // Regular users only see their own
    : [];

  const createRequest = async (
    newRequest: Omit<ItemRequest, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!user) return;

    try {
      // Add userId to the request and ensure required fields are present
      const requestWithUserId = {
        ...newRequest,
        userId: user.id,
        // Make sure these required fields are present
        itemId: newRequest.itemId || newRequest.inventoryItemId,
        quantity: newRequest.quantity || 1,
        reason: newRequest.reason || newRequest.description,
      };

      console.log("Creating request with data:", requestWithUserId);

      // Create a fallback request object in case the server fails
      const fallbackRequest: ItemRequest = {
        id: uuidv4(),
        ...requestWithUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: requestWithUserId.status || "pending",
      };

      let createdRequest: ItemRequest | null = null;
      let serverError: Error | null = null;

      try {
        // Try to create the request in the database
        createdRequest = await requestDbApi.create(requestWithUserId);

        if (!createdRequest) {
          throw new Error("Failed to create request - no response from server");
        }
      } catch (error) {
        console.error("Server error creating request:", error);
        serverError = error instanceof Error ? error : new Error(String(error));

        // If we're in development mode or the error is not critical, use the fallback
        if (
          process.env.NODE_ENV === "development" ||
          window.confirm(
            "There was an issue connecting to the server. Would you like to continue with a local version? (Your request will be saved locally but may not be visible to administrators until connectivity is restored.)"
          )
        ) {
          console.log("Using fallback request object:", fallbackRequest);
          createdRequest = fallbackRequest;
        } else {
          // User chose not to use fallback
          throw serverError;
        }
      }

      console.log("Request created successfully:", createdRequest);

      // Update the local state
      dispatch({ type: "CREATE_REQUEST", payload: createdRequest });

      // Force a refresh to ensure the request is properly loaded
      console.log("Refreshing requests after creation...");
      setTimeout(() => {
        refreshRequests()
          .then(() => {
            console.log("Requests refreshed after creation");
          })
          .catch((err) => {
            console.error("Error refreshing requests after creation:", err);
          });
      }, 500);

      console.log("Creating notifications for new request...");

      try {
        // Create notification for the user who created the request
        createNotification({
          userId: user.id,
          type: "request_submitted",
          message: `Your request for "${createdRequest.title}" has been submitted`,
          relatedItemId: createdRequest.id,
        });

        // Create notifications for admins and managers
        createNotificationForRole({
          role: "admin",
          type: "request_submitted",
          message: `New request: "${createdRequest.title}" from ${user.name} requires your review`,
          relatedItemId: createdRequest.id,
          excludeUserId: user.id, // Don't notify the user who created the request
        });

        createNotificationForRole({
          role: "manager",
          type: "request_submitted",
          message: `New request: "${createdRequest.title}" from ${user.name} requires your review`,
          relatedItemId: createdRequest.id,
          excludeUserId: user.id, // Don't notify the user who created the request
        });
      } catch (notificationError) {
        // Don't let notification errors prevent the request from being created
        console.error("Error creating notifications:", notificationError);
      }

      // If we used the fallback but there was a server error, inform the user
      if (serverError && createdRequest === fallbackRequest) {
        console.warn("Request was created locally but not saved to the server");
        setTimeout(() => {
          // Use a more user-friendly message without an alert
          dispatch({
            type: "SET_MESSAGE",
            payload: {
              type: "warning",
              text: "Your request was saved locally but there was an issue connecting to the server. The request may not be visible to administrators until connectivity is restored.",
            },
          });
        }, 100);
      }

      return createdRequest;
    } catch (error) {
      console.error("Error creating request:", error);

      // Show a more user-friendly error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error occurred while creating request";

      // Use our message system instead of an alert
      dispatch({
        type: "SET_MESSAGE",
        payload: {
          type: "error",
          text: `Failed to create request: ${errorMessage}`,
        },
      });

      throw error;
    }
  };

  const updateRequest = async (updatedRequest: ItemRequest) => {
    try {
      console.log("RequestContext: Updating request:", updatedRequest);

      // Find the current request to check for status changes
      const currentRequest = requests.find((r) => r.id === updatedRequest.id);
      const statusChanged =
        currentRequest && currentRequest.status !== updatedRequest.status;

      // Update the request in the database
      const updated = await requestDbApi.update(updatedRequest);
      console.log("RequestContext: Server response:", updated);

      // Update the local state
      dispatch({
        type: "UPDATE_REQUEST",
        payload: updated,
      });
      console.log("RequestContext: Local state updated");

      // Force a refresh to ensure the request is properly updated
      console.log("Refreshing requests after update...");
      setTimeout(() => {
        refreshRequests()
          .then(() => {
            console.log("Requests refreshed after update");
          })
          .catch((err) => {
            console.error("Error refreshing requests after update:", err);
          });
      }, 500);

      // Create notifications based on status changes
      if (statusChanged && currentRequest) {
        console.log(
          "Status changed from",
          currentRequest.status,
          "to",
          updatedRequest.status
        );
        const requestOwner = currentRequest.userId;
        console.log("Creating notifications for request owner:", requestOwner);

        // Status changed to approved
        if (updatedRequest.status === "approved") {
          // Get the request owner's user data
          let requestOwnerUser = null;
          try {
            requestOwnerUser = await userApi.getById(requestOwner);
          } catch (error) {
            console.error("Error fetching request owner:", error);
          }
          const requestOwnerName = requestOwnerUser?.name || "User";

          // Notify the request owner
          createNotification({
            userId: requestOwner,
            type: "request_approved",
            message: `Your request for "${
              updated.title
            }" has been approved by ${user?.name || "Admin"}`,
            relatedItemId: updated.id,
          });

          // Notify other admins and managers
          if (user) {
            createNotificationForRole({
              role: "admin",
              type: "request_approved",
              message: `Request "${updated.title}" from ${requestOwnerName} was approved by ${user.name}`,
              relatedItemId: updated.id,
              excludeUserId: user.id, // Don't notify the user who approved
            });

            createNotificationForRole({
              role: "manager",
              type: "request_approved",
              message: `Request "${updated.title}" from ${requestOwnerName} was approved by ${user.name}`,
              relatedItemId: updated.id,
              excludeUserId: user.id, // Don't notify the user who approved
            });
          }
        }

        // Status changed to rejected
        else if (updatedRequest.status === "rejected") {
          // Get the request owner's user data
          let requestOwnerUser = null;
          try {
            requestOwnerUser = await userApi.getById(requestOwner);
          } catch (error) {
            console.error("Error fetching request owner:", error);
          }
          const requestOwnerName = requestOwnerUser?.name || "User";

          // Notify the request owner
          createNotification({
            userId: requestOwner,
            type: "request_rejected",
            message: `Your request for "${
              updated.title
            }" has been rejected by ${user?.name || "Admin"}`,
            relatedItemId: updated.id,
          });

          // Notify other admins and managers
          if (user) {
            createNotificationForRole({
              role: "admin",
              type: "request_rejected",
              message: `Request "${updated.title}" from ${requestOwnerName} was rejected by ${user.name}`,
              relatedItemId: updated.id,
              excludeUserId: user.id, // Don't notify the user who rejected
            });

            createNotificationForRole({
              role: "manager",
              type: "request_rejected",
              message: `Request "${updated.title}" from ${requestOwnerName} was rejected by ${user.name}`,
              relatedItemId: updated.id,
              excludeUserId: user.id, // Don't notify the user who rejected
            });
          }
        }

        // Status changed to fulfilled
        else if (updatedRequest.status === "fulfilled") {
          // Get the request owner's user data
          let requestOwnerUser = null;
          try {
            requestOwnerUser = await userApi.getById(requestOwner);
          } catch (error) {
            console.error("Error fetching request owner:", error);
          }
          const requestOwnerName = requestOwnerUser?.name || "User";

          // Notify the request owner
          createNotification({
            userId: requestOwner,
            type: "request_fulfilled",
            message: `Your request for "${
              updated.title
            }" has been fulfilled by ${user?.name || "Admin"}`,
            relatedItemId: updated.id,
          });

          // Notify other admins and managers
          if (user) {
            createNotificationForRole({
              role: "admin",
              type: "request_fulfilled",
              message: `Request "${updated.title}" from ${requestOwnerName} was fulfilled by ${user.name}`,
              relatedItemId: updated.id,
              excludeUserId: user.id, // Don't notify the user who fulfilled
            });

            createNotificationForRole({
              role: "manager",
              type: "request_fulfilled",
              message: `Request "${updated.title}" from ${requestOwnerName} was fulfilled by ${user.name}`,
              relatedItemId: updated.id,
              excludeUserId: user.id, // Don't notify the user who fulfilled
            });
          }
        }
      }

      return updated;
    } catch (error) {
      console.error("Error updating request:", error);
      throw error;
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      // Delete the request from the database
      await requestDbApi.delete(id);

      // Update the local state
      dispatch({ type: "DELETE_REQUEST", payload: id });

      // Force a refresh to ensure the request is properly deleted
      console.log("Refreshing requests after deletion...");
      setTimeout(() => {
        refreshRequests()
          .then(() => {
            console.log("Requests refreshed after deletion");
          })
          .catch((err) => {
            console.error("Error refreshing requests after deletion:", err);
          });
      }, 500);
    } catch (error) {
      console.error("Error deleting request:", error);
      throw error;
    }
  };

  const addComment = async (requestId: string, content: string) => {
    if (!user) return;

    try {
      // Add the comment to the database
      const comment = await requestDbApi.addComment(
        requestId,
        user.id,
        content
      );

      // Update the local state
      dispatch({ type: "ADD_COMMENT", payload: { requestId, comment } });

      // Find the request to get its details
      const request = requests.find((r) => r.id === requestId);

      if (request) {
        // Get the request owner's user data
        let requestOwnerUser: User | null = null;
        try {
          requestOwnerUser = await userApi.getById(request.userId);
        } catch (error) {
          console.error("Error fetching request owner:", error);
        }

        const requestOwnerName = requestOwnerUser?.name || "User";

        // If the comment is from the request owner, notify admins and managers
        if (user.id === request.userId) {
          createNotificationForRole({
            role: "admin",
            type: "comment_added",
            message: `${user.name} added a comment to their request "${request.title}"`,
            relatedItemId: requestId,
            excludeUserId: user.id,
          });

          createNotificationForRole({
            role: "manager",
            type: "comment_added",
            message: `${user.name} added a comment to their request "${request.title}"`,
            relatedItemId: requestId,
            excludeUserId: user.id,
          });
        }
        // If the comment is from an admin or manager, notify the request owner
        else if (user.role === "admin" || user.role === "manager") {
          createNotification({
            userId: request.userId,
            type: "comment_added",
            message: `${user.name} (${user.role}) commented on your request "${
              request.title
            }": "${content.substring(0, 30)}${
              content.length > 30 ? "..." : ""
            }"`,
            relatedItemId: requestId,
          });

          // Also notify other admins and managers
          if (user.role === "admin") {
            createNotificationForRole({
              role: "admin",
              type: "comment_added",
              message: `${user.name} commented on ${requestOwnerName}'s request "${request.title}"`,
              relatedItemId: requestId,
              excludeUserId: user.id,
            });

            createNotificationForRole({
              role: "manager",
              type: "comment_added",
              message: `${user.name} (admin) commented on ${requestOwnerName}'s request "${request.title}"`,
              relatedItemId: requestId,
              excludeUserId: user.id,
            });
          } else if (user.role === "manager") {
            createNotificationForRole({
              role: "manager",
              type: "comment_added",
              message: `${user.name} commented on ${requestOwnerName}'s request "${request.title}"`,
              relatedItemId: requestId,
              excludeUserId: user.id,
            });

            createNotificationForRole({
              role: "admin",
              type: "comment_added",
              message: `${user.name} (manager) commented on ${requestOwnerName}'s request "${request.title}"`,
              relatedItemId: requestId,
              excludeUserId: user.id,
            });
          }
        }
      }

      return comment;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  const getRequestById = async (id: string) => {
    try {
      // First check if we have it in our local state
      const localRequest = requests.find((request) => request.id === id);
      if (localRequest) return localRequest;

      // If not found locally, fetch from the database
      return await requestDbApi.getById(id);
    } catch (error) {
      console.error(`Error getting request ${id}:`, error);
      throw error;
    }
  };

  const clearMessage = () => {
    setMessage(null);
  };

  return (
    <RequestContext.Provider
      value={{
        requests,
        userRequests,
        loading,
        refreshRequests,
        lastRefreshed,
        message,
        createRequest,
        updateRequest,
        deleteRequest,
        addComment,
        getRequestById,
        clearMessage,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
}

export const useRequests = () => {
  const context = useContext(RequestContext);
  if (context === undefined) {
    throw new Error("useRequests must be used within a RequestProvider");
  }
  return context;
};
