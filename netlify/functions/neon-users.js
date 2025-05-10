const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

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
  console.log(`User action: ${action}`);

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
        const query = `
          SELECT id, name, email, role, department, avatar_url, created_at, updated_at
          FROM users
          ORDER BY name
        `;

        const result = await client.query(query);
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
            body: JSON.stringify({ message: 'User ID is required' }),
          };
        }

        const query = `
          SELECT id, name, email, role, department, avatar_url, created_at, updated_at
          FROM users
          WHERE id = $1
        `;

        const result = await client.query(query, [id]);
        
        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'User not found' }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows[0]),
        };
      }

      case 'create': {
        const { name, email, password, role, department, avatarUrl } = requestBody;
        
        if (!name || !email || !password || !role) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'Name, email, password, and role are required' }),
          };
        }

        // Check if user with this email already exists
        const checkQuery = 'SELECT id FROM users WHERE email = $1';
        const checkResult = await client.query(checkQuery, [email]);
        
        if (checkResult.rows.length > 0) {
          return {
            statusCode: 409,
            headers,
            body: JSON.stringify({ message: 'User with this email already exists' }),
          };
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const id = uuidv4();
        const now = new Date().toISOString();

        const query = `
          INSERT INTO users (id, name, email, password_hash, role, department, avatar_url, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id, name, email, role, department, avatar_url, created_at, updated_at
        `;

        const values = [
          id,
          name,
          email,
          hashedPassword,
          role,
          department || '',
          avatarUrl || '',
          now,
          now,
        ];

        const result = await client.query(query, values);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(result.rows[0]),
        };
      }

      case 'update': {
        const { id, name, email, password, role, department, avatarUrl } = requestBody;
        
        if (!id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: 'User ID is required' }),
          };
        }

        // Check if user exists
        const checkQuery = 'SELECT id FROM users WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'User not found' }),
          };
        }

        // Build the update query
        let query = 'UPDATE users SET updated_at = $1';
        const now = new Date().toISOString();
        const values = [now];
        let paramIndex = 2;

        if (name) {
          query += `, name = $${paramIndex}`;
          values.push(name);
          paramIndex++;
        }

        if (email) {
          query += `, email = $${paramIndex}`;
          values.push(email);
          paramIndex++;
        }

        if (password) {
          // Hash the new password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          
          query += `, password_hash = $${paramIndex}`;
          values.push(hashedPassword);
          paramIndex++;
        }

        if (role) {
          query += `, role = $${paramIndex}`;
          values.push(role);
          paramIndex++;
        }

        if (department !== undefined) {
          query += `, department = $${paramIndex}`;
          values.push(department);
          paramIndex++;
        }

        if (avatarUrl !== undefined) {
          query += `, avatar_url = $${paramIndex}`;
          values.push(avatarUrl);
          paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING id, name, email, role, department, avatar_url, created_at, updated_at`;
        values.push(id);

        const result = await client.query(query, values);

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
            body: JSON.stringify({ message: 'User ID is required' }),
          };
        }

        // Check if user exists
        const checkQuery = 'SELECT id FROM users WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'User not found' }),
          };
        }

        // Delete the user
        const query = 'DELETE FROM users WHERE id = $1';
        await client.query(query, [id]);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'User deleted successfully' }),
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
    console.error('Error handling user request:', error);
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
