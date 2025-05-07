const { pool, query } = require('./neon-client');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    // Check if categories table exists
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    
    // Get categories
    const categoriesResult = await query(`
      SELECT * FROM categories ORDER BY id
    `);
    
    // Get inventory items
    const itemsResult = await query(`
      SELECT * FROM inventory_items ORDER BY id
    `);
    
    // Get count of items per category
    const categoryCountsResult = await query(`
      SELECT 
        c.id, 
        c.name, 
        COUNT(i.id) as item_count
      FROM 
        categories c
      LEFT JOIN
        inventory_items i ON c.id = i.category_id
      GROUP BY
        c.id, c.name
      ORDER BY
        c.id
    `);
    
    // Check sequence values
    const categorySeqResult = await query(`
      SELECT last_value, is_called FROM categories_id_seq
    `);
    
    const itemSeqResult = await query(`
      SELECT last_value, is_called FROM inventory_items_id_seq
    `);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        tables,
        categories: categoriesResult.rows,
        items: itemsResult.rows,
        categoryCounts: categoryCountsResult.rows,
        sequences: {
          categorySeq: categorySeqResult.rows[0],
          itemSeq: itemSeqResult.rows[0]
        }
      }, null, 2),
    };
  } catch (error) {
    console.error('Error checking database:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Error checking database', 
        error: error.message 
      }),
    };
  }
};
