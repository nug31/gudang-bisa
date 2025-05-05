import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function testUpdateRequest() {
  try {
    console.log("Testing update request functionality...");

    // Connect to the database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "gudang",
    });

    console.log("Connected to database");

    // Get a request to update
    const [requests] = await connection.query(
      "SELECT * FROM item_requests LIMIT 1"
    );

    if (requests.length === 0) {
      console.log("No requests found in the database");
      await connection.end();
      return;
    }

    const request = requests[0];
    console.log("Found request to update:", request);

    // Update the request status
    const newStatus = request.status === "pending" ? "approved" : "pending";
    console.log(
      `Updating request status from ${request.status} to ${newStatus}`
    );

    const [updateResult] = await connection.query(
      `UPDATE item_requests
       SET status = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [newStatus, request.id]
    );

    console.log("Update result:", updateResult);

    // Verify the update
    const [updatedRequests] = await connection.query(
      "SELECT * FROM item_requests WHERE id = ?",
      [request.id]
    );

    if (updatedRequests.length === 0) {
      console.log("Could not find the updated request");
    } else {
      console.log("Updated request:", updatedRequests[0]);
      console.log(
        "Status updated successfully:",
        updatedRequests[0].status === newStatus
      );
    }

    await connection.end();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error testing update request:", error);
  }
}

testUpdateRequest();
