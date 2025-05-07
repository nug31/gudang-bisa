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

  try {
    // Test database connection
    const result = await query('SELECT NOW() as current_time');
    
    // Check if inventory_items table exists
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    
    // Get schema for inventory_items if it exists
    let inventoryItemsSchema = null;
    if (tables.includes('inventory_items')) {
      const schemaResult = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'inventory_items'
      `);
      inventoryItemsSchema = schemaResult.rows;
    }
    
    // Get schema for categories if it exists
    let categoriesSchema = null;
    if (tables.includes('categories')) {
      const schemaResult = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'categories'
      `);
      categoriesSchema = schemaResult.rows;
    }
    
    // Get sample data from inventory_items if it exists
    let inventoryItemsSample = null;
    if (tables.includes('inventory_items')) {
      const sampleResult = await query(`
        SELECT * FROM inventory_items LIMIT 5
      `);
      inventoryItemsSample = sampleResult.rows;
    }
    
    // Get sample data from categories if it exists
    let categoriesSample = null;
    if (tables.includes('categories')) {
      const sampleResult = await query(`
        SELECT * FROM categories LIMIT 5
      `);
      categoriesSample = sampleResult.rows;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Database connection successful',
        currentTime: result.rows[0].current_time,
        tables,
        inventoryItemsSchema,
        categoriesSchema,
        inventoryItemsSample,
        categoriesSample
      }),
    };
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Database connection error', 
        error: error.message 
      }),
    };
  }
};
