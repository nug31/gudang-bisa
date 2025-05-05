import React, { createContext, useContext, useState, useEffect } from "react";
import { Notification, NotificationType, User } from "../types";
import { notifications as mockNotifications } from "../data/mockData";
import { useAuth } from "./AuthContext";
import {
  createNotification as createNotificationService,
  createNotificationForRole as createNotificationForRoleService,
} from "../services/notificationService";

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  createNotification: (params: CreateNotificationParams) => Notification;
  createNotificationForRole: (params: CreateNotificationForRoleParams) => void;
};

type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  message: string;
  relatedItemId?: string;
};

type CreateNotificationForRoleParams = {
  role: "admin" | "manager" | "user";
  type: NotificationType;
  message: string;
  relatedItemId?: string;
  excludeUserId?: string;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Fetch all users for role-based notifications
  useEffect(() => {
    // In a real app, this would be an API call
    // For now, we'll use mock data
    import("../data/mockData").then(({ users }) => {
      setAllUsers(users);
    });
  }, []);

  // Load notifications from localStorage when the component mounts
  useEffect(() => {
    if (user) {
      try {
        // Try to get notifications from localStorage first
        const storedNotifications = localStorage.getItem("notifications");
        let allNotifications = mockNotifications;

        if (storedNotifications) {
          const parsedNotifications = JSON.parse(storedNotifications);
          // Combine mock notifications with stored notifications
          allNotifications = [...mockNotifications, ...parsedNotifications];
        }

        // Filter notifications for current user
        const userNotifications = allNotifications.filter(
          (notification) => notification.userId === user.id
        );

        // Sort by creation date (newest first)
        userNotifications.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setNotifications(userNotifications);
        console.log(
          "Loaded notifications for user:",
          user.id,
          userNotifications.length
        );
      } catch (error) {
        console.error("Error loading notifications:", error);
        // Fallback to mock notifications
        const userNotifications = mockNotifications.filter(
          (notification) => notification.userId === user.id
        );
        setNotifications(userNotifications);
      }
    } else {
      setNotifications([]);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    // Update in-memory state
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    // Update in localStorage
    try {
      const storedNotifications = localStorage.getItem("notifications") || "[]";
      const parsedNotifications = JSON.parse(storedNotifications);
      const updatedNotifications = parsedNotifications.map(
        (notification: Notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
      );
      localStorage.setItem(
        "notifications",
        JSON.stringify(updatedNotifications)
      );
    } catch (error) {
      console.error(
        "Error updating notification read status in localStorage:",
        error
      );
    }
  };

  const markAllAsRead = () => {
    // Update in-memory state
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );

    // Update in localStorage
    try {
      const storedNotifications = localStorage.getItem("notifications") || "[]";
      const parsedNotifications = JSON.parse(storedNotifications);

      // Only mark notifications for the current user as read
      const updatedNotifications = parsedNotifications.map(
        (notification: Notification) =>
          notification.userId === user?.id
            ? { ...notification, read: true }
            : notification
      );

      localStorage.setItem(
        "notifications",
        JSON.stringify(updatedNotifications)
      );
    } catch (error) {
      console.error(
        "Error marking all notifications as read in localStorage:",
        error
      );
    }
  };

  const createNotification = ({
    userId,
    type,
    message,
    relatedItemId,
  }: CreateNotificationParams): Notification => {
    // Use the notification service to create the notification
    const newNotification = createNotificationService(
      userId,
      type,
      message,
      relatedItemId
    );

    // Store the notification in localStorage
    try {
      const storedNotifications = localStorage.getItem("notifications") || "[]";
      const parsedNotifications = JSON.parse(storedNotifications);
      parsedNotifications.push(newNotification);
      localStorage.setItem(
        "notifications",
        JSON.stringify(parsedNotifications)
      );
      console.log("Stored notification in localStorage:", newNotification);
    } catch (error) {
      console.error("Error storing notification in localStorage:", error);
    }

    // Add to state if it's for the current user
    if (user && userId === user.id) {
      setNotifications((prev) => [newNotification, ...prev]);
    }

    return newNotification;
  };

  const createNotificationForRole = ({
    role,
    type,
    message,
    relatedItemId,
    excludeUserId,
  }: CreateNotificationForRoleParams) => {
    // Use the notification service to create notifications for the role
    const notifications = createNotificationForRoleService(
      role,
      type,
      message,
      relatedItemId,
      excludeUserId
    );

    // Store the notifications in localStorage
    try {
      const storedNotifications = localStorage.getItem("notifications") || "[]";
      const parsedNotifications = JSON.parse(storedNotifications);
      // Add all new notifications to localStorage
      parsedNotifications.push(...notifications);
      localStorage.setItem(
        "notifications",
        JSON.stringify(parsedNotifications)
      );
      console.log(
        `Stored ${notifications.length} role-based notifications in localStorage`
      );
    } catch (error) {
      console.error(
        "Error storing role-based notifications in localStorage:",
        error
      );
    }

    // Add to state if any of the notifications are for the current user
    if (user) {
      const userNotifications = notifications.filter(
        (n) => n.userId === user.id
      );
      if (userNotifications.length > 0) {
        setNotifications((prev) => [...userNotifications, ...prev]);
      }
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        createNotification,
        createNotificationForRole,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
