import { v4 as uuidv4 } from "uuid";
import { Notification, NotificationType, User } from "../types";
import { users } from "../data/mockData";

// Create a notification
export const createNotification = (
  userId: string,
  type: NotificationType,
  message: string,
  relatedItemId?: string
): Notification => {
  const newNotification: Notification = {
    id: uuidv4(),
    userId,
    type,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    relatedItemId,
  };

  // In a real app, we would save this to the database
  console.log("NOTIFICATION CREATED:", {
    userId,
    type,
    message,
    relatedItemId,
  });

  return newNotification;
};

// Create notifications for all users with a specific role
export const createNotificationForRole = (
  role: "admin" | "manager" | "user",
  type: NotificationType,
  message: string,
  relatedItemId?: string,
  excludeUserId?: string
): Notification[] => {
  // Find all users with the specified role
  const usersWithRole = users.filter(
    (u) => u.role === role && u.id !== excludeUserId
  );

  const notifications: Notification[] = [];

  // Log role-based notification creation
  console.log("ROLE NOTIFICATION CREATED:", {
    role,
    type,
    message,
    relatedItemId,
    excludeUserId,
    usersCount: usersWithRole.length,
  });

  // Create a notification for each user with the role
  usersWithRole.forEach((targetUser) => {
    const notification = createNotification(
      targetUser.id,
      type,
      message,
      relatedItemId
    );
    notifications.push(notification);
  });

  return notifications;
};
