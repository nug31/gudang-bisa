const supabase = require('./supabase-client');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' })
    };
  }

  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact' });
    
    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Supabase connection error', details: error.message })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Supabase connection successful',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        data 
      })
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
