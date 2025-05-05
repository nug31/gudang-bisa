const supabase = require('./supabase-client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' })
    };
  }

  const path = event.path.replace('/.netlify/functions/users', '');
  const segments = path.split('/').filter(Boolean);
  const id = segments[0];
  const action = segments[1];

  try {
    // GET /users - Get all users
    if (event.httpMethod === 'GET' && !id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }
    
    // GET /users/:id - Get user by ID
    if (event.httpMethod === 'GET' && id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }
    
    // POST /users - Create new user
    if (event.httpMethod === 'POST') {
      const { name, email, password, role, department, avatar_url } = JSON.parse(event.body);
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (existingUser) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User with this email already exists' })
        };
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            department,
            avatar_url,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data[0])
      };
    }
    
    // PUT /users/:id - Update user
    if (event.httpMethod === 'PUT' && id) {
      const { name, email, role, department, avatar_url } = JSON.parse(event.body);
      
      // Update user
      const { data, error } = await supabase
        .from('users')
        .update({
          name,
          email,
          role,
          department,
          avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data[0])
      };
    }
    
    // DELETE /users/:id - Delete user
    if (event.httpMethod === 'DELETE' && id) {
      // Delete user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return {
        statusCode: 204,
        headers,
        body: ''
      };
    }
    
    // If no route matches
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
};
