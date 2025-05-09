import { config } from 'dotenv';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

// Neon connection details
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error('Missing Neon connection string. Please set NEON_CONNECTION_STRING in your .env file.');
  process.exit(1);
}

async function addSampleRequests() {
  console.log('Adding sample inventory requests to Neon database...');
  
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to Neon database.');
    
    // Get all categories
    const categoriesResult = await client.query('SELECT id, name FROM categories');
    const categories = categoriesResult.rows;
    
    if (categories.length === 0) {
      console.error('No categories found. Please add categories first.');
      process.exit(1);
    }
    
    console.log(`Found ${categories.length} categories.`);
    
    // Create a map of category names to IDs for easier lookup
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name.toLowerCase()] = category.id;
    });
    
    // Get all users
    const usersResult = await client.query('SELECT id, name, role FROM users');
    const users = usersResult.rows;
    
    if (users.length === 0) {
      console.error('No users found. Please add users first.');
      process.exit(1);
    }
    
    console.log(`Found ${users.length} users.`);
    
    // Find admin and regular users
    const adminUser = users.find(user => user.role === 'admin');
    const regularUsers = users.filter(user => user.role === 'user');
    
    if (!adminUser) {
      console.log('No admin user found. Creating a regular user request only.');
    }
    
    if (regularUsers.length === 0) {
      console.log('No regular users found. Creating a test user...');
      
      // Create a test user if no regular users exist
      const testUserId = uuidv4();
      await client.query(
        `INSERT INTO users (id, name, email, password, role, department) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          testUserId,
          'Test User',
          'test@gudangmitra.com',
          '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.', // password: test123
          'user',
          'Testing'
        ]
      );
      
      console.log('Created test user with email: test@gudangmitra.com and password: test123');
      
      // Refresh users list
      const updatedUsersResult = await client.query('SELECT id, name, role FROM users WHERE role = $1', ['user']);
      const updatedUsers = updatedUsersResult.rows;
      
      if (updatedUsers.length === 0) {
        console.error('Failed to create test user. Exiting.');
        process.exit(1);
      }
      
      regularUsers.push(updatedUsers[0]);
    }
    
    // Sample request data
    const sampleRequests = [
      {
        title: 'Office Supplies Request',
        description: 'Need new pens and notebooks for the marketing team',
        categoryName: 'Office Supplies',
        priority: 'medium',
        status: 'pending',
        quantity: 5,
        totalCost: 25.99
      },
      {
        title: 'New Mouse Request',
        description: 'My current mouse is not working properly, need a replacement',
        categoryName: 'Electronics',
        priority: 'high',
        status: 'approved',
        quantity: 1,
        totalCost: 19.99
      },
      {
        title: 'Cleaning Supplies Request',
        description: 'Need disinfectant wipes for the office kitchen',
        categoryName: 'Cleaning Supplies',
        priority: 'low',
        status: 'fulfilled',
        quantity: 3,
        totalCost: 20.97
      },
      {
        title: 'Ergonomic Chair Request',
        description: 'Need an ergonomic chair due to back pain',
        categoryName: 'Furniture',
        priority: 'critical',
        status: 'rejected',
        quantity: 1,
        totalCost: 149.99,
        rejectionReason: 'Budget constraints, please resubmit next quarter'
      },
      {
        title: 'Coffee Pods Request',
        description: 'We are running low on coffee pods for the break room',
        categoryName: 'Kitchen Supplies',
        priority: 'medium',
        status: 'pending',
        quantity: 2,
        totalCost: 49.98
      },
      {
        title: 'First Aid Kit Request',
        description: 'Need to replace expired first aid kit in the server room',
        categoryName: 'Safety Equipment',
        priority: 'high',
        status: 'approved',
        quantity: 1,
        totalCost: 29.99
      },
      {
        title: 'Printer Paper Request',
        description: 'Need more printer paper for the finance department',
        categoryName: 'Printing Supplies',
        priority: 'medium',
        status: 'pending',
        quantity: 5,
        totalCost: 49.95
      }
    ];
    
    // Check existing requests
    const existingResult = await client.query('SELECT title FROM item_requests');
    const existingRequests = existingResult.rows.map(row => row.title.toLowerCase());
    
    console.log(`Found ${existingRequests.length} existing requests.`);
    
    // Add requests that don't already exist
    let addedCount = 0;
    
    for (const request of sampleRequests) {
      if (!existingRequests.includes(request.title.toLowerCase())) {
        const categoryId = categoryMap[request.categoryName.toLowerCase()];
        
        if (!categoryId) {
          console.log(`Category not found for request: ${request.title}. Skipping.`);
          continue;
        }
        
        // Randomly select a user for this request
        const user = regularUsers[Math.floor(Math.random() * regularUsers.length)];
        
        const requestId = uuidv4();
        const now = new Date();
        
        // Prepare request data
        const requestData = {
          id: requestId,
          title: request.title,
          description: request.description,
          categoryId: categoryId,
          priority: request.priority,
          status: request.status,
          userId: user.id,
          quantity: request.quantity,
          totalCost: request.totalCost,
          createdAt: now,
          approvedAt: null,
          approvedBy: null,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
          fulfillmentDate: null
        };
        
        // Set status-specific fields
        if (request.status === 'approved') {
          requestData.approvedAt = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
          requestData.approvedBy = adminUser ? adminUser.id : null;
        } else if (request.status === 'rejected') {
          requestData.rejectedAt = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
          requestData.rejectedBy = adminUser ? adminUser.id : null;
          requestData.rejectionReason = request.rejectionReason || 'Request denied';
        } else if (request.status === 'fulfilled') {
          requestData.approvedAt = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago
          requestData.approvedBy = adminUser ? adminUser.id : null;
          requestData.fulfillmentDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
        }
        
        // Insert the request
        await client.query(
          `INSERT INTO item_requests 
          (id, title, description, category_id, priority, status, user_id, quantity, total_cost, 
           created_at, approved_at, approved_by, rejected_at, rejected_by, rejection_reason, fulfillment_date) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            requestData.id,
            requestData.title,
            requestData.description,
            requestData.categoryId,
            requestData.priority,
            requestData.status,
            requestData.userId,
            requestData.quantity,
            requestData.totalCost,
            requestData.createdAt,
            requestData.approvedAt,
            requestData.approvedBy,
            requestData.rejectedAt,
            requestData.rejectedBy,
            requestData.rejectionReason,
            requestData.fulfillmentDate
          ]
        );
        
        console.log(`Added request: ${request.title}`);
        addedCount++;
      } else {
        console.log(`Request already exists: ${request.title}`);
      }
    }
    
    console.log(`Added ${addedCount} new requests.`);
    console.log('Sample requests added successfully!');
    
  } catch (error) {
    console.error('Error adding sample requests:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the function
addSampleRequests().catch(error => {
  console.error('Failed to add sample requests:', error);
  process.exit(1);
});
