const { pool, query } = require('./neon-client');

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
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Invalid JSON in request body' }),
      };
    }

    const sqlQuery = data.query;
    const params = data.params || [];

    if (!sqlQuery) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Query is required' }),
      };
    }

    // Execute the query
    const result = await query(sqlQuery, params);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Query executed successfully',
        result: result.rows,
        rowCount: result.rowCount
      }),
    };
  } catch (error) {
    console.error('Error executing query:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Error executing query', 
        error: error.message 
      }),
    };
  }
};
