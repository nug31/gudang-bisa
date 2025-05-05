import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root path handler - send a simple HTML response
app.get("/", (req, res) => {
  console.log("Root path requested");
  
  // Send a simple HTML response
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
        <p>The API server is running successfully.</p>
        <div class="api-status" id="api-status">Checking API status...</div>
        <a href="/api/test" class="button">Test API</a>
      </div>
      <script>
        // Check API status
        fetch('/api/test')
          .then(response => response.json())
          .then(data => {
            document.getElementById('api-status').innerHTML = 
              '<strong>API Status:</strong> ' + (data.message || 'Connected');
          })
          .catch(error => {
            document.getElementById('api-status').innerHTML = 
              '<strong>API Status:</strong> Error - ' + error.message;
          });
      </script>
    </body>
    </html>
  `);
});

// API test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working", serverTime: new Date().toISOString() });
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Static server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the welcome page`);
});
