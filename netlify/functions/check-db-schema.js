const { Client } = require("pg");

// Get the Neon PostgreSQL connection string from environment variables
const connectionString = process.env.NEON_CONNECTION_STRING;

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

  // Create a new client
  const client = new Client({
    connectionString,
  });

  try {
    // Connect to the database
    await client.connect();
    console.log("Connected to Neon database");

    // Get all tables in the public schema
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    const tablesResult = await client.query(tablesQuery);
    const tables = tablesResult.rows.map((row) => row.table_name);
    console.log("Tables in database:", tables);

    // Get the schema for each table
    const tableSchemas = {};
    for (const table of tables) {
      const schemaQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `;
      const schemaResult = await client.query(schemaQuery, [table]);
      tableSchemas[table] = schemaResult.rows;
    }

    // Get row counts for each table
    const tableCounts = {};
    for (const table of tables) {
      const countQuery = `SELECT COUNT(*) FROM ${table};`;
      const countResult = await client.query(countQuery);
      tableCounts[table] = parseInt(countResult.rows[0].count, 10);
    }

    // Create the requests table if it doesn't exist
    if (!tables.includes("requests")) {
      console.log("Creating requests table...");
      const createTableQuery = `
        CREATE TABLE requests (
          id UUID PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          user_id UUID NOT NULL,
          item_id UUID,
          quantity INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          admin_comment TEXT
        );
      `;
      await client.query(createTableQuery);
      console.log("Requests table created successfully");
      
      // Add the new table to our results
      tables.push("requests");
      tableSchemas["requests"] = [
        { column_name: "id", data_type: "uuid", is_nullable: "NO" },
        { column_name: "title", data_type: "character varying", is_nullable: "NO" },
        { column_name: "description", data_type: "text", is_nullable: "YES" },
        { column_name: "status", data_type: "character varying", is_nullable: "NO" },
        { column_name: "user_id", data_type: "uuid", is_nullable: "NO" },
        { column_name: "item_id", data_type: "uuid", is_nullable: "YES" },
        { column_name: "quantity", data_type: "integer", is_nullable: "NO" },
        { column_name: "created_at", data_type: "timestamp with time zone", is_nullable: "YES" },
        { column_name: "updated_at", data_type: "timestamp with time zone", is_nullable: "YES" },
        { column_name: "admin_comment", data_type: "text", is_nullable: "YES" },
      ];
      tableCounts["requests"] = 0;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        connected: true,
        tables,
        schemas: tableSchemas,
        counts: tableCounts,
      }),
    };
  } catch (error) {
    console.error("Error connecting to database:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        connected: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
    };
  } finally {
    // Close the database connection
    await client.end();
  }
};
