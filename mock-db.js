// Mock database implementation
import { v4 as uuidv4 } from "uuid";

// Mock data
const users = [
  {
    id: uuidv4(),
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    department: "IT",
    avatarUrl: null,
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Regular User",
    email: "user@example.com",
    role: "user",
    department: "Marketing",
    avatarUrl: null,
    createdAt: new Date().toISOString()
  }
];

const categories = [
  {
    id: uuidv4(),
    name: "Office Supplies",
    description: "General office supplies like pens, paper, etc.",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "IT Equipment",
    description: "Computers, monitors, keyboards, etc.",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Furniture",
    description: "Office furniture like desks, chairs, etc.",
    createdAt: new Date().toISOString()
  }
];

const requests = [
  {
    id: uuidv4(),
    title: "New Laptop Request",
    description: "Need a new laptop for development work",
    category: "IT Equipment",
    priority: "high",
    status: "pending",
    userId: users[1].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    fulfillmentDate: null,
    quantity: 1
  }
];

const comments = [
  {
    id: uuidv4(),
    requestId: requests[0].id,
    userId: users[0].id,
    content: "We'll review this request soon",
    createdAt: new Date().toISOString()
  }
];

const inventoryItems = [
  {
    id: uuidv4(),
    name: "Dell XPS 13",
    description: "13-inch laptop with Intel Core i7",
    categoryId: categories[1].id,
    sku: "DELL-XPS-13",
    quantityAvailable: 5,
    quantityReserved: 0,
    unitPrice: 1299.99,
    location: "Warehouse A",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "HP Monitor 27-inch",
    description: "27-inch 4K monitor",
    categoryId: categories[1].id,
    sku: "HP-MON-27",
    quantityAvailable: 10,
    quantityReserved: 2,
    unitPrice: 349.99,
    location: "Warehouse B",
    createdAt: new Date().toISOString()
  }
];

// Mock database functions
export default {
  users: {
    getAll: () => Promise.resolve(users),
    getById: (id) => Promise.resolve(users.find(user => user.id === id) || null),
    create: (user) => {
      const newUser = { ...user, id: uuidv4(), createdAt: new Date().toISOString() };
      users.push(newUser);
      return Promise.resolve(newUser);
    },
    update: (id, userData) => {
      const index = users.findIndex(user => user.id === id);
      if (index === -1) return Promise.resolve(null);
      
      users[index] = { ...users[index], ...userData };
      return Promise.resolve(users[index]);
    },
    delete: (id) => {
      const index = users.findIndex(user => user.id === id);
      if (index === -1) return Promise.resolve(false);
      
      users.splice(index, 1);
      return Promise.resolve(true);
    }
  },
  
  categories: {
    getAll: () => Promise.resolve(categories),
    getById: (id) => Promise.resolve(categories.find(cat => cat.id === id) || null),
    create: (category) => {
      const newCategory = { ...category, id: uuidv4(), createdAt: new Date().toISOString() };
      categories.push(newCategory);
      return Promise.resolve(newCategory);
    },
    update: (id, categoryData) => {
      const index = categories.findIndex(cat => cat.id === id);
      if (index === -1) return Promise.resolve(null);
      
      categories[index] = { ...categories[index], ...categoryData };
      return Promise.resolve(categories[index]);
    },
    delete: (id) => {
      const index = categories.findIndex(cat => cat.id === id);
      if (index === -1) return Promise.resolve(false);
      
      categories.splice(index, 1);
      return Promise.resolve(true);
    }
  },
  
  requests: {
    getAll: () => Promise.resolve(requests),
    getById: (id) => Promise.resolve(requests.find(req => req.id === id) || null),
    create: (request) => {
      const newRequest = { 
        ...request, 
        id: uuidv4(), 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      requests.push(newRequest);
      return Promise.resolve(newRequest);
    },
    update: (id, requestData) => {
      const index = requests.findIndex(req => req.id === id);
      if (index === -1) return Promise.resolve(null);
      
      requests[index] = { 
        ...requests[index], 
        ...requestData,
        updatedAt: new Date().toISOString()
      };
      return Promise.resolve(requests[index]);
    },
    delete: (id) => {
      const index = requests.findIndex(req => req.id === id);
      if (index === -1) return Promise.resolve(false);
      
      requests.splice(index, 1);
      return Promise.resolve(true);
    }
  },
  
  comments: {
    getByRequestId: (requestId) => Promise.resolve(comments.filter(comment => comment.requestId === requestId)),
    create: (comment) => {
      const newComment = { ...comment, id: uuidv4(), createdAt: new Date().toISOString() };
      comments.push(newComment);
      return Promise.resolve(newComment);
    },
    delete: (id) => {
      const index = comments.findIndex(comment => comment.id === id);
      if (index === -1) return Promise.resolve(false);
      
      comments.splice(index, 1);
      return Promise.resolve(true);
    }
  },
  
  inventory: {
    getAll: () => Promise.resolve(inventoryItems),
    getById: (id) => Promise.resolve(inventoryItems.find(item => item.id === id) || null),
    getByCategory: (categoryId) => Promise.resolve(inventoryItems.filter(item => item.categoryId === categoryId)),
    create: (item) => {
      const newItem = { ...item, id: uuidv4(), createdAt: new Date().toISOString() };
      inventoryItems.push(newItem);
      return Promise.resolve(newItem);
    },
    update: (id, itemData) => {
      const index = inventoryItems.findIndex(item => item.id === id);
      if (index === -1) return Promise.resolve(null);
      
      inventoryItems[index] = { ...inventoryItems[index], ...itemData };
      return Promise.resolve(inventoryItems[index]);
    },
    delete: (id) => {
      const index = inventoryItems.findIndex(item => item.id === id);
      if (index === -1) return Promise.resolve(false);
      
      inventoryItems.splice(index, 1);
      return Promise.resolve(true);
    }
  }
};
