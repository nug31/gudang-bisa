const supabase = require('./supabase-client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' })
    };
  }

  const path = event.path.replace('/.netlify/functions/auth', '');
  const segments = path.split('/').filter(Boolean);
  const action = segments[0];

  try {
    // POST /auth/login - Login
    if (event.httpMethod === 'POST' && action === 'login') {
      const { email, password } = JSON.parse(event.body);
      
      // Get user by email
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error || !user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid email or password' })
        };
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid email or password' })
        };
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(userWithoutPassword)
      };
    }
    
    // POST /auth/register - Register
    if (event.httpMethod === 'POST' && action === 'register') {
      const { name, email, password, department } = JSON.parse(event.body);
      
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
            role: 'user',
            department,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = data[0];
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(userWithoutPassword)
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
