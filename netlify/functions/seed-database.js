const { pool, query } = require('./neon-client');

// Sample inventory items for each category
const sampleItems = [
  // Cleaning Supplies
  {
    name: 'Paper Towels',
    description: 'Pack of 6 rolls, absorbent paper towels',
    category_id: 1, // Assuming Cleaning Supplies has ID 1
    sku: 'CL-001',
    quantity_available: 50,
    quantity_reserved: 0,
    unit_price: 12.99,
    location: 'Shelf A1',
    image_url: null
  },
  {
    name: 'All-Purpose Cleaner',
    description: 'Multi-surface cleaning solution, 32oz bottle',
    category_id: 1,
    sku: 'CL-002',
    quantity_available: 30,
    quantity_reserved: 2,
    unit_price: 5.99,
    location: 'Shelf A2',
    image_url: null
  },
  {
    name: 'Disinfectant Wipes',
    description: 'Container of 75 disinfecting wipes',
    category_id: 1,
    sku: 'CL-003',
    quantity_available: 25,
    quantity_reserved: 0,
    unit_price: 7.49,
    location: 'Shelf A3',
    image_url: null
  },
  
  // Electronics
  {
    name: 'HDMI Cable',
    description: '6ft HDMI cable, 4K compatible',
    category_id: 2, // Assuming Electronics has ID 2
    sku: 'EL-001',
    quantity_available: 15,
    quantity_reserved: 1,
    unit_price: 9.99,
    location: 'Shelf B1',
    image_url: null
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with USB receiver',
    category_id: 2,
    sku: 'EL-002',
    quantity_available: 10,
    quantity_reserved: 0,
    unit_price: 19.99,
    location: 'Shelf B2',
    image_url: null
  },
  {
    name: 'USB Flash Drive',
    description: '32GB USB 3.0 flash drive',
    category_id: 2,
    sku: 'EL-003',
    quantity_available: 20,
    quantity_reserved: 0,
    unit_price: 14.99,
    location: 'Shelf B3',
    image_url: null
  },
  
  // Furniture
  {
    name: 'Office Chair',
    description: 'Adjustable ergonomic office chair with lumbar support',
    category_id: 3, // Assuming Furniture has ID 3
    sku: 'FN-001',
    quantity_available: 5,
    quantity_reserved: 1,
    unit_price: 129.99,
    location: 'Section C1',
    image_url: null
  },
  {
    name: 'Desk Lamp',
    description: 'LED desk lamp with adjustable brightness',
    category_id: 3,
    sku: 'FN-002',
    quantity_available: 8,
    quantity_reserved: 0,
    unit_price: 34.99,
    location: 'Section C2',
    image_url: null
  },
  {
    name: 'Bookshelf',
    description: '5-tier bookshelf, wooden construction',
    category_id: 3,
    sku: 'FN-003',
    quantity_available: 3,
    quantity_reserved: 0,
    unit_price: 89.99,
    location: 'Section C3',
    image_url: null
  },
  
  // Hardware
  {
    name: 'Screwdriver Set',
    description: '10-piece screwdriver set with various sizes',
    category_id: 4, // Assuming Hardware has ID 4
    sku: 'HW-001',
    quantity_available: 12,
    quantity_reserved: 0,
    unit_price: 24.99,
    location: 'Shelf D1',
    image_url: null
  },
  {
    name: 'Hammer',
    description: '16oz claw hammer with rubber grip',
    category_id: 4,
    sku: 'HW-002',
    quantity_available: 8,
    quantity_reserved: 1,
    unit_price: 15.99,
    location: 'Shelf D2',
    image_url: null
  },
  {
    name: 'Measuring Tape',
    description: '25ft retractable measuring tape',
    category_id: 4,
    sku: 'HW-003',
    quantity_available: 15,
    quantity_reserved: 0,
    unit_price: 9.99,
    location: 'Shelf D3',
    image_url: null
  },
  
  // Kitchen Supplies
  {
    name: 'Coffee Maker',
    description: '12-cup programmable coffee maker',
    category_id: 5, // Assuming Kitchen Supplies has ID 5
    sku: 'KS-001',
    quantity_available: 6,
    quantity_reserved: 1,
    unit_price: 49.99,
    location: 'Shelf E1',
    image_url: null
  },
  {
    name: 'Paper Cups',
    description: 'Pack of 100 disposable paper cups, 12oz',
    category_id: 5,
    sku: 'KS-002',
    quantity_available: 30,
    quantity_reserved: 0,
    unit_price: 8.99,
    location: 'Shelf E2',
    image_url: null
  },
  {
    name: 'Tea Bags',
    description: 'Box of 50 assorted tea bags',
    category_id: 5,
    sku: 'KS-003',
    quantity_available: 20,
    quantity_reserved: 0,
    unit_price: 12.99,
    location: 'Shelf E3',
    image_url: null
  }
];

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
    // Check if categories exist, if not create them
    const categoriesResult = await query(`
      SELECT COUNT(*) as count FROM categories
    `);
    
    const categoriesCount = parseInt(categoriesResult.rows[0].count);
    
    if (categoriesCount === 0) {
      // Create categories
      await query(`
        INSERT INTO categories (name, description) VALUES
        ('Cleaning Supplies', 'Cleaning products, paper towels, and other janitorial supplies'),
        ('Electronics', 'Computers, phones, cables, and other electronic devices'),
        ('Furniture', 'Desks, chairs, cabinets, and other office furniture'),
        ('Hardware', 'Hardware tools and equipment'),
        ('Kitchen Supplies', 'Coffee, tea, snacks, and kitchen equipment')
      `);
      console.log('Categories created successfully');
    }
    
    // Check if inventory items exist
    const itemsResult = await query(`
      SELECT COUNT(*) as count FROM inventory_items
    `);
    
    const itemsCount = parseInt(itemsResult.rows[0].count);
    
    if (itemsCount === 0) {
      // Insert sample items
      for (const item of sampleItems) {
        await query(`
          INSERT INTO inventory_items (
            name, 
            description, 
            category_id, 
            sku, 
            quantity_available, 
            quantity_reserved, 
            unit_price, 
            location, 
            image_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          item.name,
          item.description,
          item.category_id,
          item.sku,
          item.quantity_available,
          item.quantity_reserved,
          item.unit_price,
          item.location,
          item.image_url
        ]);
      }
      console.log('Sample inventory items created successfully');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Database seeded successfully',
        categoriesCount,
        itemsCount,
        itemsAdded: itemsCount === 0 ? sampleItems.length : 0
      }),
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Error seeding database', 
        error: error.message 
      }),
    };
  }
};
