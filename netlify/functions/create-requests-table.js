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

    // Check if the requests table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'requests'
      );
    `;
    const tableCheckResult = await client.query(tableCheckQuery);
    const tableExists = tableCheckResult.rows[0].exists;

    let result = {};

    if (tableExists) {
      // Drop the existing table
      console.log("Dropping existing requests table...");
      await client.query("DROP TABLE requests CASCADE;");
      result.droppedTable = true;
    }

    // Create the requests table with the correct schema
    console.log("Creating requests table...");
    const createTableQuery = `
      CREATE TABLE requests (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        user_id UUID NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        admin_comment TEXT,
        priority VARCHAR(50) DEFAULT 'medium',
        fulfillment_date TIMESTAMP WITH TIME ZONE
      );
    `;
    await client.query(createTableQuery);
    result.createdTable = true;

    // Create a sample request
    const sampleRequestQuery = `
      INSERT INTO requests (
        id, 
        title, 
        description, 
        status, 
        user_id, 
        item_id, 
        quantity, 
        created_at, 
        updated_at, 
        priority
      )
      VALUES (
        '00000000-0000-0000-0000-000000000001', 
        'Sample Request', 
        'This is a sample request', 
        'pending', 
        '75efc6b0-84ae-48b8-a945-a9d5287c2e20', 
        8, 
        1, 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP, 
        'medium'
      )
      RETURNING *;
    `;
    const sampleRequestResult = await client.query(sampleRequestQuery);
    result.sampleRequest = sampleRequestResult.rows[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Requests table created successfully",
        result,
      }),
    };
  } catch (error) {
    console.error("Error creating requests table:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Error creating requests table",
        error: error.message,
        stack: error.stack,
      }),
    };
  } finally {
    // Close the database connection
    await client.end();
  }
};
