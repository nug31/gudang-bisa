import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the database connection string from environment variables
const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

console.log('Using connection string:', connectionString.replace(/:[^:]*@/, ':****@'));

// Create a new PostgreSQL client
const client = new pg.Client({
  connectionString: connectionString,
});

async function testRequestWithUuid() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to Neon PostgreSQL database');

    // Get the Office category UUID from the category_uuids table
    const categoryResult = await client.query(`
      SELECT * FROM category_uuids WHERE name = 'Office'
    `);
    
    if (categoryResult.rows.length === 0) {
      throw new Error('Office category UUID not found');
    }
    
    const officeCategoryUuid = categoryResult.rows[0].id;
    console.log('Office category UUID:', officeCategoryUuid);
    
    // Get the Admin user ID
    const userResult = await client.query(`
      SELECT * FROM users WHERE role = 'admin' LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      throw new Error('Admin user not found');
    }
    
    const adminUserId = userResult.rows[0].id;
    console.log('Admin user ID:', adminUserId);
    
    // Generate a unique ID for the request
    const requestId = uuidv4();
    
    // Create a test request
    const testRequest = {
      id: requestId,
      title: "UUID Test Request " + new Date().toISOString(),
      description: "This is a test request created with proper UUID values",
      category_id: officeCategoryUuid,
      priority: "medium",
      status: "pending",
      user_id: adminUserId,
      quantity: 1,
      total_cost: null,
      created_at: new Date(),
      updated_at: new Date(),
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      fulfillment_date: null
    };
    
    console.log('Creating test request with ID:', requestId);
    
    // Insert the request into the database
    const insertQuery = `
      INSERT INTO item_requests (
        id, 
        title, 
        description, 
        category_id, 
        priority, 
        status, 
        user_id, 
        quantity, 
        total_cost, 
        created_at, 
        updated_at, 
        approved_at, 
        approved_by, 
        rejected_at, 
        rejected_by, 
        rejection_reason, 
        fulfillment_date
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id
    `;
    
    const insertValues = [
      testRequest.id,
      testRequest.title,
      testRequest.description,
      testRequest.category_id,
      testRequest.priority,
      testRequest.status,
      testRequest.user_id,
      testRequest.quantity,
      testRequest.total_cost,
      testRequest.created_at,
      testRequest.updated_at,
      testRequest.approved_at,
      testRequest.approved_by,
      testRequest.rejected_at,
      testRequest.rejected_by,
      testRequest.rejection_reason,
      testRequest.fulfillment_date
    ];
    
    const insertResult = await client.query(insertQuery, insertValues);
    console.log('Request inserted successfully with ID:', insertResult.rows[0].id);
    
    // Verify the request was inserted by fetching it
    const selectQuery = `
      SELECT r.*, c.name as category_name, u.name as user_name
      FROM item_requests r
      JOIN category_uuids c ON r.category_id = c.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = $1
    `;
    
    const selectResult = await client.query(selectQuery, [requestId]);
    
    if (selectResult.rows.length > 0) {
      console.log('✅ Request verification successful!');
      console.log('Retrieved request:');
      console.log('- ID:', selectResult.rows[0].id);
      console.log('- Title:', selectResult.rows[0].title);
      console.log('- Description:', selectResult.rows[0].description);
      console.log('- Category:', selectResult.rows[0].category_name);
      console.log('- Priority:', selectResult.rows[0].priority);
      console.log('- Status:', selectResult.rows[0].status);
      console.log('- User:', selectResult.rows[0].user_name);
      console.log('- Quantity:', selectResult.rows[0].quantity);
    } else {
      console.log('❌ Request verification failed! Request not found in database.');
    }
    
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Error testing request with UUID:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the test
testRequestWithUuid();
