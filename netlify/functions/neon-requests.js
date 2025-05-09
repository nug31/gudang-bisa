const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Get the Neon PostgreSQL connection string from environment variables
const connectionString = process.env.NEON_CONNECTION_STRING;

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  // Parse the request body
  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid request body' }),
    };
  }

  const { action } = requestBody;
  console.log(`Request action: ${action}, timestamp: ${Date.now()}`);

  // Create a new client
  const client = new Client({
    connectionString,
  });

  try {
    // Connect to the database
    await client.connect();

    // Handle different actions
    switch (action) {
      case 'getAll': {
        const { userId, status } = requestBody;
        console.log(`Handling getAll request with userId: ${userId}, status: ${status}`);

        let query = `
          SELECT r.*, 
                 u.name as requester_name, 
                 u.email as requester_email,
                 i.name as item_name,
                 i.description as item_description,
                 i.image_url as item_image_url,
                 c.name as category_name
          FROM requests r
          LEFT JOIN users u ON r.user_id = u.id
          LEFT JOIN inventory_items i ON r.item_id = i.id
          LEFT JOIN categories c ON i.category_id = c.id
        `;

        const queryParams = [];
        const conditions = [];

        if (userId) {
          conditions.push(`r.user_id = $${queryParams.length + 1}`);
          queryParams.push(userId);
        }

        if (status) {
          conditions.push(`r.status = $${queryParams.length + 1}`);
          queryParams.push(status);
        }

        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ' ORDER BY r.created_at DESC';

        const result = await client.query(query, queryParams);
        
        // If no results, return mock data for development
        if (result.rows.length === 0) {
          console.log('No requests found, returning 20 mock requests');
          
          // Generate 20 mock requests
          const mockRequests = Array.from({ length: 20 }, (_, i) => {
            const id = `Auto-generated Request ${Math.random().toString(36).substring(2, 10)}`;
            return {
              id,
              title: `Request for Office Supplies ${i + 1}`,
              description: `This is a mock request for testing purposes ${i + 1}`,
              status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
              user_id: '00000000-0000-0000-0000-000000000001',
              requester_name: 'Mock User',
              requester_email: 'mock@example.com',
              item_id: '00000000-0000-0000-0000-000000000001',
              item_name: `Mock Item ${i + 1}`,
              item_description: `This is a mock item for testing purposes ${i + 1}`,
              category_name: ['Office', 'Cleaning', 'Hardware', 'Other'][Math.floor(Math.random() * 4)],
              quantity: Math.floor(Math.random() * 10) + 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          });
          
          console.log(`Returning ${mockRequests.length} requests`);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(mockRequests),
          };
        }
        
        console.log(`Returning ${result.rows.length} requests`);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows),
        };
      }

      case 'getById': {
        const { id } = requestBody;
        
        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Request ID is required' }),
          };
        }

        const query = `
          SELECT r.*, 
                 u.name as requester_name, 
                 u.email as requester_email,
                 i.name as item_name,
                 i.description as item_description,
                 i.image_url as item_image_url,
                 c.name as category_name
          FROM requests r
          LEFT JOIN users u ON r.user_id = u.id
          LEFT JOIN inventory_items i ON r.item_id = i.id
          LEFT JOIN categories c ON i.category_id = c.id
          WHERE r.id = $1
        `;

        const result = await client.query(query, [id]);
        
        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Request not found' }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows[0]),
        };
      }

      case 'create': {
        const { userId, itemId, quantity, reason } = requestBody;
        
        if (!userId || !itemId || !quantity) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'User ID, item ID, and quantity are required' }),
          };
        }

        // Get the item details
        const itemQuery = 'SELECT name FROM inventory_items WHERE id = $1';
        const itemResult = await client.query(itemQuery, [itemId]);
        
        if (itemResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Item not found' }),
          };
        }

        const itemName = itemResult.rows[0].name;
        const title = `Request for ${itemName}`;
        const description = reason || `Request for ${quantity} ${itemName}`;
        const id = uuidv4();
        const now = new Date().toISOString();

        const query = `
          INSERT INTO requests (id, title, description, status, user_id, item_id, quantity, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        const values = [id, title, description, 'pending', userId, itemId, quantity, now, now];
        const result = await client.query(query, values);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(result.rows[0]),
        };
      }

      case 'update': {
        const { id, status, adminComment } = requestBody;
        
        if (!id || !status) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Request ID and status are required' }),
          };
        }

        const now = new Date().toISOString();
        let query = `
          UPDATE requests
          SET status = $1, updated_at = $2
        `;
        
        const values = [status, now];
        
        if (adminComment) {
          query += ', admin_comment = $3';
          values.push(adminComment);
        }
        
        query += ' WHERE id = $' + (values.length + 1) + ' RETURNING *';
        values.push(id);

        const result = await client.query(query, values);
        
        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Request not found' }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows[0]),
        };
      }

      case 'delete': {
        const { id } = requestBody;
        
        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Request ID is required' }),
          };
        }

        const query = 'DELETE FROM requests WHERE id = $1 RETURNING id';
        const result = await client.query(query, [id]);
        
        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Request not found' }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Request deleted successfully' }),
        };
      }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid action' }),
        };
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  } finally {
    // Close the database connection
    await client.end();
  }
};
