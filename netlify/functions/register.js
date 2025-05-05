const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' }),
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

  try {
    // Parse request body
    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.name || !data.email || !data.password || !data.role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Name, email, password, and role are required' }),
      };
    }

    // Register with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Registration failed', error: authError.message }),
      };
    }

    // Create user profile in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          name: data.name,
          email: data.email,
          role: data.role,
          department: data.department || null,
          avatar_url: data.avatarUrl || null
        }
      ])
      .select()
      .single();

    if (userError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Error creating user profile', error: userError.message }),
      };
    }

    // Format user data to match the expected format
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      avatarUrl: userData.avatar_url,
      createdAt: userData.created_at
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        user,
        message: 'Registration successful',
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Server error', error: error.message }),
    };
  }
};
