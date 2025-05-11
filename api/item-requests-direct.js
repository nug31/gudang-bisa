// Vercel API route for directly checking item_requests table
import { Pool } from "pg";

// Get connection string from environment variable
const connectionString =
  process.env.NEON_CONNECTION_STRING ||
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// Create a pool with a single client
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1,
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  let client;
  try {
    // Get a client from the pool
    client = await pool.connect();
    console.log("Connected to database");

    // First check if the table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'item_requests'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;

    if (!tableExists) {
      return res.status(200).json({
        success: true,
        tableExists: false,
        message: "item_requests table does not exist",
      });
    }

    // Get count of all requests
    const countResult = await client.query(
      "SELECT COUNT(*) FROM item_requests"
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Get count by status
    const statusCountResult = await client.query(`
      SELECT status, COUNT(*)
      FROM item_requests
      GROUP BY status
    `);

    // Get 5 most recent requests
    const recentRequestsResult = await client.query(`
      SELECT * FROM item_requests
      ORDER BY created_at DESC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      tableExists: true,
      totalCount,
      statusCounts: statusCountResult.rows,
      recentRequests: recentRequestsResult.rows,
      message: "Successfully retrieved item_requests data",
    });
  } catch (error) {
    console.error("Database error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  } finally {
    if (client) {
      client.release();
    }

    try {
      await pool.end();
    } catch (err) {
      console.error("Error closing pool:", err);
    }
  }
}
