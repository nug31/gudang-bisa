import express from "express";
import { config } from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import mockDb from "./mock-db.js";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test database connection
app.get("/api/test-connection", async (req, res) => {
  res.json({ success: true, message: "Mock database connected successfully" });
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", { email });

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // For demo purposes, accept any email and either 'password' or 'password123' as the password
    if (password !== "password" && password !== "password123") {
      console.log(
        "Login failed: Invalid password. Expected 'password' or 'password123', got:",
        password
      );
      return res.status(401).json({ message: "Invalid email or password" });
    }
    console.log("Login successful with password:", password);

    // Find or create a user with the provided email
    let users = await mockDb.users.getAll();
    let user = users.find((u) => u.email === email);

    if (!user) {
      // Create a new user if not found
      user = await mockDb.users.create({
        name: email.split("@")[0],
        email,
        role: email.includes("admin") ? "admin" : "user",
        department: "General",
        avatarUrl: null,
      });
    }

    res.json({
      user: user,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Direct database access endpoint
app.post("/db/requests", async (req, res) => {
  const { action, id, request, comment } = req.body;
  console.log("Request body:", req.body);

  try {
    switch (action) {
      case "getAll":
        // Get all requests
        const requests = await mockDb.requests.getAll();
        res.json(requests);
        break;

      case "getById":
        // Get request by ID
        const requestResult = await mockDb.requests.getById(id);

        if (!requestResult) {
          return res.status(404).json({ message: "Request not found" });
        }

        // Get comments for the request
        const comments = await mockDb.comments.getByRequestId(id);
        requestResult.comments = comments;

        res.json(requestResult);
        break;

      case "create":
        // Create a new request
        const newRequest = await mockDb.requests.create(request);
        res.json(newRequest);
        break;

      case "update":
        // Update a request
        const updatedRequest = await mockDb.requests.update(id, request);

        if (!updatedRequest) {
          return res.status(404).json({ message: "Request not found" });
        }

        res.json(updatedRequest);
        break;

      case "delete":
        // Delete a request
        const deleted = await mockDb.requests.delete(id);

        if (!deleted) {
          return res.status(404).json({ message: "Request not found" });
        }

        res.json({ message: "Request deleted successfully" });
        break;

      case "addComment":
        // Add a comment to a request
        if (!comment) {
          return res.status(400).json({ message: "Comment is required" });
        }

        const newComment = await mockDb.comments.create(comment);
        res.json(newComment);
        break;

      default:
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Handle inventory requests
app.post("/db/inventory", async (req, res) => {
  const { action, categoryId } = req.body;
  console.log("Inventory request body:", req.body);

  try {
    switch (action) {
      case "getAll":
        // Get all inventory items
        const items = await mockDb.inventory.getAll();
        res.json(items);
        break;

      case "getByCategory":
        // Get inventory items by category
        if (!categoryId) {
          return res.status(400).json({ message: "Category ID is required" });
        }

        const categoryItems = await mockDb.inventory.getByCategory(categoryId);
        res.json(categoryItems);
        break;

      case "create":
        // Create a new inventory item
        console.log("Creating inventory item with data:", req.body);

        // Extract item data - support both formats:
        // 1. { action: "create", item: {...} }
        // 2. { action: "create", name: "...", description: "...", ... }
        let itemData;

        if (req.body.item) {
          // Format 1: Item data is in the 'item' property
          itemData = req.body.item;
        } else {
          // Format 2: Item data is spread in the request body
          const { action, ...rest } = req.body;
          itemData = rest;
        }

        console.log("Processed item data:", itemData);

        if (!itemData || !itemData.name) {
          return res
            .status(400)
            .json({ message: "Item data with name is required" });
        }

        try {
          const newItem = await mockDb.inventory.create(itemData);
          console.log("Item created successfully:", newItem);
          res.json(newItem);
        } catch (error) {
          console.error("Error creating inventory item:", error);
          res.status(500).json({
            message: "Error creating inventory item",
            error: error.message,
          });
        }
        break;

      case "update":
        // Update an inventory item
        const { id, ...updateData } = req.body;

        if (!id) {
          return res.status(400).json({ message: "Item ID is required" });
        }

        // Remove action from the update data
        const { action: _, ...itemUpdateData } = updateData;

        console.log(
          "Updating inventory item:",
          id,
          "with data:",
          itemUpdateData
        );

        const updatedItem = await mockDb.inventory.update(id, itemUpdateData);

        if (!updatedItem) {
          return res.status(404).json({ message: "Item not found" });
        }

        console.log("Item updated successfully:", updatedItem);
        res.json(updatedItem);
        break;

      case "delete":
        // Delete an inventory item
        const { id: deleteId } = req.body;

        if (!deleteId) {
          return res.status(400).json({ message: "Item ID is required" });
        }

        const deleted = await mockDb.inventory.delete(deleteId);

        if (!deleted) {
          return res.status(404).json({ message: "Item not found" });
        }

        res.json({ message: "Item deleted successfully" });
        break;

      default:
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Handle users requests
app.post("/db/users", async (req, res) => {
  const { action } = req.body;
  console.log("Users request body:", req.body);

  try {
    switch (action) {
      case "getAll":
        // Get all users
        const users = await mockDb.users.getAll();
        res.json(users);
        break;

      case "getById":
        // Get a specific user by ID
        const { id } = req.body;

        if (!id) {
          return res.status(400).json({ message: "User ID is required" });
        }

        const user = await mockDb.users.getById(id);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
        break;

      case "create":
        // Create a new user
        const { userData } = req.body;

        if (!userData) {
          return res.status(400).json({ message: "User data is required" });
        }

        const newUser = await mockDb.users.create(userData);
        res.json(newUser);
        break;

      case "update":
        // Update a user
        const {
          id: updateId,
          name,
          email,
          role,
          department,
          avatarUrl,
        } = req.body;

        if (!updateId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        const updatedUser = await mockDb.users.update(updateId, {
          name,
          email,
          role,
          department,
          avatarUrl,
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json(updatedUser);
        break;

      case "delete":
        // Delete a user
        const { id: deleteId } = req.body;

        if (!deleteId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        const deleted = await mockDb.users.delete(deleteId);

        if (!deleted) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
        break;

      default:
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Handle categories requests
app.post("/db/categories", async (req, res) => {
  const { action } = req.body;
  console.log("Categories request body:", req.body);

  try {
    switch (action) {
      case "getAll":
        // Get all categories
        const categories = await mockDb.categories.getAll();
        res.json(categories);
        break;

      case "create":
        // Create a new category
        const { name, description } = req.body;

        console.log(
          "Creating category with name:",
          name,
          "and description:",
          description
        );

        if (!name) {
          return res.status(400).json({ message: "Category name is required" });
        }

        try {
          const newCategory = await mockDb.categories.create({
            name,
            description,
          });

          console.log("Category created successfully:", newCategory);
          res.json(newCategory);
        } catch (error) {
          console.error("Error creating category:", error);
          res
            .status(500)
            .json({ message: "Error creating category", error: error.message });
        }
        break;

      case "update":
        // Update a category
        const {
          id,
          name: updateName,
          description: updateDescription,
        } = req.body;

        if (!id) {
          return res.status(400).json({ message: "Category ID is required" });
        }

        const categoryData = {
          name: updateName,
          description: updateDescription,
        };

        const updatedCategory = await mockDb.categories.update(
          id,
          categoryData
        );

        if (!updatedCategory) {
          return res.status(404).json({ message: "Category not found" });
        }

        res.json(updatedCategory);
        break;

      case "delete":
        // Delete a category
        const { id: deleteId } = req.body;

        if (!deleteId) {
          return res.status(400).json({ message: "Category ID is required" });
        }

        const deleted = await mockDb.categories.delete(deleteId);

        if (!deleted) {
          return res.status(404).json({ message: "Category not found" });
        }

        res.json({ message: "Category deleted successfully" });
        break;

      default:
        res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error executing database operation:", error);
    res.status(500).json({ message: "Database error", error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
});

export default app;
