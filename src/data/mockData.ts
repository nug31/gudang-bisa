import { User, ItemRequest, Category, Notification } from "../types";
import { subDays, formatISO } from "date-fns";

export const users: User[] = [
  {
    id: "733dce62-3971-4448-8fc7-2d5e77928b00",
    name: "Admin User",
    email: "admin@example.com",
    password: "password",
    role: "admin",
    department: "IT",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "a5b9c0d1-e2f3-4a5b-9c0d-1e2f3a4b5c6d",
    name: "Manager User",
    email: "manager@example.com",
    password: "password",
    role: "manager",
    department: "Human Resources",
    avatarUrl: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: "8037e703-807f-43de-a378-cc6305d69bb0",
    name: "Regular User",
    email: "user@example.com",
    password: "password",
    role: "user",
    department: "Marketing",
    avatarUrl: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: "3",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    password: "password",
    role: "user",
    department: "Sales",
    avatarUrl: "https://i.pravatar.cc/150?img=9",
  },
];

export const categories: Category[] = [
  {
    id: "1f34fae5-830b-4c6c-9092-7ea7c1f11433",
    name: "Hardware",
    description: "Computer hardware, peripherals, and accessories",
  },
  {
    id: "58043a89-b0f8-4235-93af-3cc1b83fb4f9",
    name: "Software",
    description: "Software licenses, applications, and services",
  },
  {
    id: "3",
    name: "Office Supplies",
    description: "General office supplies and stationery",
  },
  {
    id: "4",
    name: "Furniture",
    description: "Office furniture and fixtures",
  },
  {
    id: "5",
    name: "Training",
    description: "Professional development and training resources",
  },
];

export const itemRequests: ItemRequest[] = [
  {
    id: "1",
    title: "New Laptop",
    description: "Need a new MacBook Pro for development work",
    category: "1",
    priority: "high",
    status: "approved",
    userId: "2",
    createdAt: formatISO(subDays(new Date(), 7)),
    updatedAt: formatISO(subDays(new Date(), 5)),
    approvedAt: formatISO(subDays(new Date(), 5)),
    approvedBy: "1",
    fulfillmentDate: formatISO(subDays(new Date(), 2)),
    quantity: 1,
    totalCost: 2499.99,
    comments: [
      {
        id: "101",
        requestId: "1",
        userId: "1",
        content:
          "This request has been approved. We will procure the laptop within the next 2 business days.",
        createdAt: formatISO(subDays(new Date(), 5)),
      },
    ],
  },
  {
    id: "2",
    title: "Adobe Creative Cloud License",
    description: "Annual subscription for the design team",
    category: "2",
    priority: "medium",
    status: "pending",
    userId: "3",
    createdAt: formatISO(subDays(new Date(), 3)),
    updatedAt: formatISO(subDays(new Date(), 3)),
    quantity: 5,
    totalCost: 2995.0,
    comments: [],
  },
  {
    id: "3",
    title: "Office Desk Chair",
    description: "Ergonomic chair for my workspace",
    category: "4",
    priority: "low",
    status: "rejected",
    userId: "2",
    createdAt: formatISO(subDays(new Date(), 14)),
    updatedAt: formatISO(subDays(new Date(), 12)),
    rejectedAt: formatISO(subDays(new Date(), 12)),
    rejectedBy: "1",
    rejectionReason: "Budget constraints this quarter. Please resubmit in Q3.",
    quantity: 1,
    totalCost: 349.99,
    comments: [
      {
        id: "102",
        requestId: "3",
        userId: "1",
        content:
          "Unfortunately, we have to reject this request due to budget constraints this quarter. Please resubmit in Q3.",
        createdAt: formatISO(subDays(new Date(), 12)),
      },
      {
        id: "103",
        requestId: "3",
        userId: "2",
        content: "Understood. I will resubmit in Q3.",
        createdAt: formatISO(subDays(new Date(), 11)),
      },
    ],
  },
  {
    id: "4",
    title: "Conference Room Projector",
    description: "Need a new 4K projector for the main conference room",
    category: "1",
    priority: "critical",
    status: "pending",
    userId: "3",
    createdAt: formatISO(subDays(new Date(), 1)),
    updatedAt: formatISO(subDays(new Date(), 1)),
    quantity: 1,
    totalCost: 1299.99,
    comments: [],
  },
  {
    id: "5",
    title: "React Advanced Training Course",
    description: "Online course for the frontend development team",
    category: "5",
    priority: "medium",
    status: "draft",
    userId: "2",
    createdAt: formatISO(new Date()),
    updatedAt: formatISO(new Date()),
    quantity: 3,
    totalCost: null,
    comments: [],
  },
];

export const notifications: Notification[] = [
  {
    id: "1",
    userId: "2",
    type: "request_approved",
    message: 'Your request for "New Laptop" has been approved',
    read: false,
    createdAt: formatISO(subDays(new Date(), 5)),
    relatedItemId: "1",
  },
  {
    id: "2",
    userId: "3",
    type: "request_submitted",
    message:
      'Your request for "Adobe Creative Cloud License" has been submitted',
    read: true,
    createdAt: formatISO(subDays(new Date(), 3)),
    relatedItemId: "2",
  },
  {
    id: "3",
    userId: "2",
    type: "request_rejected",
    message: 'Your request for "Office Desk Chair" has been rejected',
    read: false,
    createdAt: formatISO(subDays(new Date(), 12)),
    relatedItemId: "3",
  },
  {
    id: "4",
    userId: "1",
    type: "request_submitted",
    message: 'New request: "Conference Room Projector" requires your review',
    read: false,
    createdAt: formatISO(subDays(new Date(), 1)),
    relatedItemId: "4",
  },
];

// Current logged-in user (for demo purposes)
// You can change the index to test different user roles:
// users[0] = Admin User
// users[1] = Manager User
// users[2] = Regular User
export const currentUser = users[1]; // Manager User
