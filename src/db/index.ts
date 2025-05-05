import mysql from "mysql2/promise";
import mockPool from "./mock-db.js";

// Check if we should use mock database
const useMockDb = process.env.USE_MOCK_DB === "true";

// Create real database connection pool or use mock pool
let pool = useMockDb
  ? mockPool
  : mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

// Function to reinitialize database connection
export const reinitDatabase = async () => {
  const newUseMockDb = process.env.USE_MOCK_DB === "true";
  
  // Create new pool with updated configuration
  pool = newUseMockDb
    ? mockPool
    : mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
  
  console.log(`🔄 Database connection reinitialized to ${newUseMockDb ? 'mock' : 'real'} mode`);
  return testConnection();
};

// Test the connection
const testConnection = async () => {
  if (useMockDb) {
    console.log("Using mock database (as specified in .env)");
    return;
  }

  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully");
    connection.release();
  } catch (error) {
    console.error("❌ Error connecting to database:", error);
    console.log(
      "⚠️ Consider setting USE_MOCK_DB=true in .env to use mock data"
    );
  }
};

testConnection();

export default pool;
