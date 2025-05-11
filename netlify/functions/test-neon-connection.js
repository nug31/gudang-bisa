// Test function to verify Neon database connection
const { Client } = require("pg");

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Preflight call successful" }),
    };
  }

  console.log("Testing Neon database connection...");
  console.log("Timestamp:", new Date().toISOString());

  // Get connection string from environment variables or use hardcoded fallback
  const envConnectionString = process.env.NEON_CONNECTION_STRING;
  const connectionString =
    envConnectionString ||
    "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

  // Log connection string details (safely)
  console.log(
    "Environment NEON_CONNECTION_STRING available:",
    !!envConnectionString
  );
  console.log(
    "Using connection string from:",
    envConnectionString ? "environment variable" : "hardcoded fallback"
  );
  console.log("Connection string length:", connectionString.length);
  console.log(
    "Connection string first 20 chars:",
    connectionString.substring(0, 20) + "..."
  );

  // Create a new client with optimized settings for serverless environment
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Required for Neon PostgreSQL
    },
    keepAlive: false, // Disable keep-alive in serverless environment
    statement_timeout: 10000, // Statement timeout to 10 seconds
    query_timeout: 10000, // Query timeout to 10 seconds
    connectionTimeoutMillis: 10000, // Connection timeout to 10 seconds
    idle_in_transaction_session_timeout: 10000, // Idle timeout to 10 seconds
  });

  try {
    // Connect to the database with retry logic
    let connected = false;
    let retryCount = 0;
    const maxRetries = 3;
    let error = null;

    while (!connected && retryCount < maxRetries) {
      try {
        console.log(`Connection attempt ${retryCount + 1}/${maxRetries}...`);

        // Set a timeout for the connection attempt
        const connectPromise = client.connect();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Connection timeout after 10 seconds")),
            10000
          )
        );

        // Race the connection against the timeout
        await Promise.race([connectPromise, timeoutPromise]);

        connected = true;
        console.log("Successfully connected to Neon database");

        // Test the connection with a simple query
        const result = await client.query("SELECT NOW() as time");
        console.log("Database time:", result.rows[0].time);

        // Get database server version
        const versionResult = await client.query("SELECT version()");
        const dbVersion = versionResult.rows[0].version;
        console.log("Database version:", dbVersion);

        // Check for tables
        const tablesResult = await client.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name
        `);

        const tables = tablesResult.rows.map((row) => row.table_name);
        console.log(`Found ${tables.length} tables:`, tables);

        // Get counts for important tables
        const counts = {};
        for (const table of tables) {
          try {
            const countResult = await client.query(
              `SELECT COUNT(*) FROM ${table}`
            );
            counts[table] = parseInt(countResult.rows[0].count, 10);
          } catch (countError) {
            console.error(`Error counting ${table}:`, countError.message);
            counts[table] = "error";
          }
        }

        console.log("Table counts:", counts);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: "Successfully connected to Neon database",
            timestamp: new Date().toISOString(),
            dbTime: result.rows[0].time,
            dbVersion: dbVersion,
            tables: tables,
            counts: counts,
            connectionSource: envConnectionString
              ? "environment variable"
              : "hardcoded fallback",
          }),
        };
      } catch (connectError) {
        retryCount++;
        error = connectError;
        console.error(
          `Connection attempt ${retryCount} failed:`,
          connectError.message
        );

        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff with jitter)
          const baseDelay = Math.pow(2, retryCount) * 500;
          const jitter = Math.floor(Math.random() * 500);
          const delay = baseDelay + jitter;
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // If we get here, all connection attempts failed
    console.error("All connection attempts failed");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Failed to connect to Neon database",
        error: error ? error.message : "Unknown error",
        errorCode: error ? error.code : "UNKNOWN",
        timestamp: new Date().toISOString(),
        connectionSource: envConnectionString
          ? "environment variable"
          : "hardcoded fallback",
      }),
    };
  } catch (error) {
    console.error("Error testing database connection:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Error testing database connection",
        error: error.message,
        errorCode: error.code || "UNKNOWN",
        timestamp: new Date().toISOString(),
      }),
    };
  } finally {
    // Close the client connection
    try {
      if (client) {
        await client.end();
        console.log("Database connection closed");
      }
    } catch (closeError) {
      console.error("Error closing client connection:", closeError);
    }
  }
};
