import express from "express";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

// Load environment variables
config();

// Set up Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve static files from the dist directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "dist")));

// Neon connection details
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error(
    "Missing Neon connection string. Please set NEON_CONNECTION_STRING in your .env file."
  );
  process.exit(1);
}

// Create a connection pool
const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Connected to Neon database!");
    client.release();
    return true;
  } catch (error) {
    console.error("Error connecting to Neon database:", error);
    return false;
  }
}

// Mock data
const mockUsers = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Admin User",
    email: "admin@gudangmitra.com",
    password: "$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.",
    role: "admin",
    department: "IT",
    avatarUrl: null,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Manager User",
    email: "manager@gudangmitra.com",
    password: "$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.",
    role: "manager",
    department: "Operations",
    avatarUrl: null,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
];

const mockCategories = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Office",
    description: "Office supplies and equipment",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Cleaning",
    description: "Cleaning supplies and equipment",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Hardware",
    description: "Hardware tools and equipment",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    name: "Other",
    description: "Other items",
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
];

const mockInventory = [
  {
    id: uuidv4(),
    name: "Pencil",
    description: "Standard #2 pencil",
    categoryId: "00000000-0000-0000-0000-000000000001",
    categoryName: "Office",
    sku: "PNCL-001",
    quantityAvailable: 100,
    quantityReserved: 0,
    unitPrice: 0.5,
    location: "Shelf A1",
    imageUrl: null,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
  {
    id: uuidv4(),
    name: "Notebook",
    description: "Spiral-bound notebook",
    categoryId: "00000000-0000-0000-0000-000000000001",
    categoryName: "Office",
    sku: "NTBK-001",
    quantityAvailable: 50,
    quantityReserved: 0,
    unitPrice: 2.5,
    location: "Shelf A2",
    imageUrl: null,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
  },
];

const mockRequests = [
  {
    id: uuidv4(),
    title: "Office Supplies Request",
    description: "Need supplies for new employee",
    categoryId: "00000000-0000-0000-0000-000000000001",
    categoryName: "Office",
    priority: "medium",
    status: "pending",
    userId: "00000000-0000-0000-0000-000000000001",
    userName: "Admin User",
    quantity: 1,
    totalCost: 0,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z",
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    fulfillmentDate: null,
  },
];

// Add a debug route
app.get("/debug", (req, res) => {
  console.log("Debug route accessed");
  res.json({ message: "Server is running" });
});

// Add a test API endpoint
app.get("/api/test", (req, res) => {
  console.log("Test API endpoint accessed");
  res.json({ status: "ok", message: "API is working" });
});

// Authentication routes
app.post(
  ["/db/auth", "/api/auth/login", "/api/auth/register"],
  async (req, res) => {
    console.log("Auth route accessed:", req.body);

    // Handle both API formats
    let action = req.body.action;

    // If this is the /api/auth/login endpoint, set action to "login"
    if (req.path === "/api/auth/login" && !action) {
      action = "login";
    }

    // If this is the /api/auth/register endpoint, set action to "register"
    if (req.path === "/api/auth/register") {
      action = "register";
    }

    try {
      switch (action) {
        case "login": {
          console.log("Login attempt with:", { email: req.body.email });
          const { email, password } = req.body;

          if (!email || !password) {
            console.log("Missing email or password");
            return res
              .status(400)
              .json({ message: "Email and password are required" });
          }

          // Find user in mock data
          const user = mockUsers.find((u) => u.email === email);

          if (!user) {
            console.log("User not found in database");
            return res.status(401).json({ message: "Invalid credentials" });
          }

          console.log("User found in database:", {
            id: user.id,
            email: user.email,
            role: user.role,
          });

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            password,
            user.password
          );
          console.log("Password validation result:", isPasswordValid);

          if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
          }

          // Return user data without password
          const { password: _, ...userData } = user;
          console.log("Login successful, returning user data:", userData);
          res.json(userData);
          break;
        }

        default:
          // For any unhandled action, return an empty array to prevent errors
          res.json([]);
      }
    } catch (err) {
      console.error("Error handling auth request:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Handle categories
app.post(["/db/categories", "/api/categories"], async (req, res) => {
  console.log("Categories route accessed:", req.body);
  res.json(mockCategories);
});

// Handle inventory
app.post(["/db/inventory", "/api/inventory"], async (req, res) => {
  console.log("Inventory route accessed:", req.body);
  res.json(mockInventory);
});

// Handle requests
app.post(["/db/requests", "/api/requests"], async (req, res) => {
  console.log("Requests route accessed:", req.body);
  res.json(mockRequests);
});

// Handle users
app.post(["/db/users", "/api/users"], async (req, res) => {
  console.log("Users route accessed:", req.body);
  
  const { action, id } = req.body;
  
  if (action === "getById" && id) {
    const user = mockUsers.find(u => u.id === id || parseInt(u.id) === parseInt(id));
    if (user) {
      const { password, ...userData } = user;
      return res.json(userData);
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  }
  
  // Return all users without passwords
  const usersWithoutPasswords = mockUsers.map(({ password, ...user }) => user);
  res.json(usersWithoutPasswords);
});

// Catch-all route to serve the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
testConnection().then((connected) => {
  if (connected) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Connected to Neon database`);
      console.log(`Using mock data for API responses`);
    });
  } else {
    console.error("Failed to connect to Neon database. Server not started.");
    process.exit(1);
  }
});
