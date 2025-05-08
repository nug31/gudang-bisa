export type User = {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional in the type since we don't always want to include it in responses
  role: "admin" | "manager" | "user";
  avatarUrl?: string;
  department?: string;
};

export type ItemRequest = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "draft" | "pending" | "approved" | "rejected" | "fulfilled";
  userId: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  fulfillmentDate?: string;
  quantity: number;
  totalCost?: number;
  attachments?: string[];
  comments?: Comment[];
};

export type Comment = {
  id: string;
  requestId: string;
  userId: string;
  content: string;
  createdAt: string;
};

export type Category = {
  id: string | number;
  name: string;
  description?: string;
  createdAt?: string;
};

export type NotificationType =
  | "request_submitted"
  | "request_approved"
  | "request_rejected"
  | "request_fulfilled"
  | "comment_added";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  relatedItemId?: string;
};
