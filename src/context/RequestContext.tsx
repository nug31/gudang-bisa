import React, {
  createContext,
  useContext,
  useState,
  useReducer,
  useEffect,
} from "react";
import { ItemRequest, Comment } from "../types";
import { itemRequests as mockRequests } from "../data/mockData";
import { useAuth } from "./AuthContext";
import { formatISO } from "date-fns";
import { requestDbApi } from "../services/api";
import {
  createNotification,
  createNotificationForRole,
} from "../services/notificationService";

type RequestAction =
  | { type: "INITIALIZE"; payload: ItemRequest[] }
  | { type: "CREATE_REQUEST"; payload: ItemRequest }
  | { type: "UPDATE_REQUEST"; payload: ItemRequest }
  | { type: "DELETE_REQUEST"; payload: string }
  | { type: "ADD_COMMENT"; payload: { requestId: string; comment: Comment } };

type RequestContextType = {
  requests: ItemRequest[];
  userRequests: ItemRequest[];
  loading: boolean;
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
    default:
      return state;
  }
}

const RequestContext = createContext<RequestContextType | undefined>(undefined);

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [requests, dispatch] = useReducer(requestReducer, []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from the database
    const fetchRequests = async () => {
      try {
        const data = await requestDbApi.getAll();
        dispatch({ type: "INITIALIZE", payload: data });
      } catch (error) {
        console.error("Error fetching requests:", error);
        // Fallback to mock data if database fetch fails
        dispatch({ type: "INITIALIZE", payload: mockRequests });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Filter requests for the current user
  const userRequests = user
    ? requests.filter((request) => request.userId === user.id)
    : [];

  const createRequest = async (
    newRequest: Omit<ItemRequest, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!user) return;

    try {
      // Add userId to the request
      const requestWithUserId = {
        ...newRequest,
        userId: user.id,
      };

      console.log("Creating request with data:", requestWithUserId);

      // Create the request in the database
      const createdRequest = await requestDbApi.create(requestWithUserId);

      if (!createdRequest) {
        throw new Error("Failed to create request - no response from server");
      }

      console.log("Request created successfully:", createdRequest);

      // Update the local state
      dispatch({ type: "CREATE_REQUEST", payload: createdRequest });

      console.log("Creating notifications for new request...");

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

      return createdRequest;
    } catch (error) {
      console.error("Error creating request:", error);

      // Show a more user-friendly error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error occurred while creating request";

      alert(`Failed to create request: ${errorMessage}`);
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
          // Find the request owner's name
          const requestOwnerUser = users.find((u) => u.id === requestOwner);
          const requestOwnerName = requestOwnerUser
            ? requestOwnerUser.name
            : "User";

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
          // Find the request owner's name
          const requestOwnerUser = users.find((u) => u.id === requestOwner);
          const requestOwnerName = requestOwnerUser
            ? requestOwnerUser.name
            : "User";

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
          // Find the request owner's name
          const requestOwnerUser = users.find((u) => u.id === requestOwner);
          const requestOwnerName = requestOwnerUser
            ? requestOwnerUser.name
            : "User";

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
        // Find the request owner's name
        const requestOwnerUser = users.find((u) => u.id === request.userId);
        const requestOwnerName = requestOwnerUser
          ? requestOwnerUser.name
          : "User";

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

  return (
    <RequestContext.Provider
      value={{
        requests,
        userRequests,
        loading,
        createRequest,
        updateRequest,
        deleteRequest,
        addComment,
        getRequestById,
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
