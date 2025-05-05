import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import { config } from "dotenv";

// Load environment variables
config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Log middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "oyishhkx_gudang",
  password: process.env.DB_PASSWORD || "Reddevils94_08",
  database: process.env.DB_NAME || "oyishhkx_gudang",
  connectTimeout: 10000, // 10 seconds
};

console.log("Database configuration:", {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
});

// Test database connection
app.get("/api/test-connection", async (req, res) => {
  try {
    console.log("Testing database connection...");

    const connection = await mysql.createConnection(dbConfig);
    console.log("Database connected successfully");

    // Get all tables
    const [tables] = await connection.query("SHOW TABLES");
    console.log("Tables in the database:");

    if (tables.length === 0) {
      console.log("No tables found in the database.");
    } else {
      tables.forEach((table) => {
        const tableName = Object.values(table)[0];
        console.log(`- ${tableName}`);
      });
    }

    // Close the connection
    await connection.end();

    res.json({
      success: true,
      message: "Database connected successfully",
      tables: tables.map((table) => Object.values(table)[0]),
    });
  } catch (error) {
    console.error("Error connecting to database:", error);
    res.status(500).json({
      success: false,
      message: "Error connecting to database",
      error: error.message,
    });
  }
});

// API endpoints for your application
// Add more endpoints as needed

// Start the API server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(
    `Test database connection at http://localhost:${PORT}/api/test-connection`
  );
});

// Serve static files from the dist directory if it exists
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  console.log(`Serving static files from ${distPath}`);
  app.use(express.static(distPath));

  // For specific routes, serve the index.html file
  app.get("/app", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.log(`Dist directory not found at ${distPath}`);

  // Serve a simple HTML page if dist directory doesn't exist
  app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gudang Mitra</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 600px;
          }
          h1 {
            color: #2c3e50;
          }
          .api-status {
            margin-top: 1rem;
            padding: 1rem;
            background-color: #f8f9fa;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.3s;
          }
          .button:hover {
            background-color: #2980b9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Gudang Mitra</h1>
          <p>The API server is running on port ${PORT}.</p>
          <div class="api-status" id="api-status">Checking API status...</div>
          <a href="/api/test-connection" class="button">Test Database Connection</a>
        </div>
        <script>
          // Check API status
          fetch('/api/test-connection')
            .then(response => response.json())
            .then(data => {
              document.getElementById('api-status').innerHTML =
                '<strong>Database Status:</strong> ' + (data.success ? 'Connected' : 'Error');
            })
            .catch(error => {
              document.getElementById('api-status').innerHTML =
                '<strong>Database Status:</strong> Error - ' + error.message;
            });
        </script>
      </body>
      </html>
    `);
  });
}
