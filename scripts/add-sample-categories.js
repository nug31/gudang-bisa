import { config } from 'dotenv';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

// Neon connection details
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error('Missing Neon connection string. Please set NEON_CONNECTION_STRING in your .env file.');
  process.exit(1);
}

// Sample categories data
const sampleCategories = [
  {
    name: 'Office Supplies',
    description: 'Pens, paper, staplers, and other office essentials'
  },
  {
    name: 'Electronics',
    description: 'Computers, phones, cables, and other electronic devices'
  },
  {
    name: 'Furniture',
    description: 'Desks, chairs, cabinets, and other office furniture'
  },
  {
    name: 'Kitchen Supplies',
    description: 'Coffee, tea, snacks, and kitchen equipment'
  },
  {
    name: 'Cleaning Supplies',
    description: 'Cleaning products, paper towels, and other janitorial supplies'
  },
  {
    name: 'Safety Equipment',
    description: 'First aid kits, fire extinguishers, and other safety items'
  },
  {
    name: 'Tools',
    description: 'Hand tools, power tools, and other maintenance equipment'
  },
  {
    name: 'Stationery',
    description: 'Notebooks, pens, pencils, and other writing materials'
  },
  {
    name: 'Printing Supplies',
    description: 'Ink, toner, paper, and other printing materials'
  },
  {
    name: 'Packaging Materials',
    description: 'Boxes, tape, bubble wrap, and other packaging supplies'
  }
];

async function addSampleCategories() {
  console.log('Adding sample categories to Neon database...');
  
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to Neon database.');
    
    // Check existing categories
    const existingResult = await client.query('SELECT name FROM categories');
    const existingCategories = existingResult.rows.map(row => row.name.toLowerCase());
    
    console.log(`Found ${existingCategories.length} existing categories.`);
    
    // Add categories that don't already exist
    let addedCount = 0;
    
    for (const category of sampleCategories) {
      if (!existingCategories.includes(category.name.toLowerCase())) {
        const categoryId = uuidv4();
        
        await client.query(
          'INSERT INTO categories (id, name, description) VALUES ($1, $2, $3)',
          [categoryId, category.name, category.description]
        );
        
        console.log(`Added category: ${category.name}`);
        addedCount++;
      } else {
        console.log(`Category already exists: ${category.name}`);
      }
    }
    
    console.log(`Added ${addedCount} new categories.`);
    console.log('Sample categories added successfully!');
    
  } catch (error) {
    console.error('Error adding sample categories:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the function
addSampleCategories().catch(error => {
  console.error('Failed to add sample categories:', error);
  process.exit(1);
});
