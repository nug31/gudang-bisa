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
    if (!data.email || !data.password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email and password are required' }),
      };
    }

    // Authenticate with Supabase
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: 'Invalid email or password', error: error.message }),
      };
    }

    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, department, avatar_url, created_at')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Error fetching user data', error: userError.message }),
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
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user,
        message: 'Login successful',
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
