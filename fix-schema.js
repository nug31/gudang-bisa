import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the database connection string from environment variables
const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

console.log('Using connection string:', connectionString.replace(/:[^:]*@/, ':****@'));

// Create a new PostgreSQL client
const client = new pg.Client({
  connectionString: connectionString,
});

async function fixSchema() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to Neon PostgreSQL database');

    // Check if the categories table has any UUID values
    const categoriesResult = await client.query(`
      SELECT * FROM categories
    `);

    console.log(`Found ${categoriesResult.rows.length} categories`);
    
    // Create UUID values for each category
    console.log('\nCreating UUID values for categories...');
    
    for (const category of categoriesResult.rows) {
      const categoryUuid = uuidv4();
      console.log(`Category ${category.id}: ${category.name} -> UUID: ${categoryUuid}`);
      
      // Create a new category with a UUID
      try {
        const insertResult = await client.query(`
          INSERT INTO category_uuids (id, category_id, name)
          VALUES ($1, $2, $3)
          ON CONFLICT (category_id) DO UPDATE
          SET name = EXCLUDED.name
          RETURNING id
        `, [categoryUuid, category.id, category.name]);
        
        console.log(`✅ Created UUID mapping for category ${category.id}: ${categoryUuid}`);
      } catch (error) {
        // If the table doesn't exist, create it
        if (error.code === '42P01') { // undefined_table
          console.log('Creating category_uuids table...');
          
          await client.query(`
            CREATE TABLE category_uuids (
              id UUID PRIMARY KEY,
              category_id INTEGER UNIQUE NOT NULL,
              name VARCHAR(255) NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
          `);
          
          console.log('Table created, retrying insertion...');
          
          const insertResult = await client.query(`
            INSERT INTO category_uuids (id, category_id, name)
            VALUES ($1, $2, $3)
            RETURNING id
          `, [categoryUuid, category.id, category.name]);
          
          console.log(`✅ Created UUID mapping for category ${category.id}: ${categoryUuid}`);
        } else {
          throw error;
        }
      }
    }
    
    // Display the category UUID mappings
    const categoryUuidsResult = await client.query(`
      SELECT * FROM category_uuids
    `);
    
    console.log('\n=== Category UUID Mappings ===');
    categoryUuidsResult.rows.forEach(mapping => {
      console.log(`- Category ID: ${mapping.category_id}, Name: ${mapping.name}, UUID: ${mapping.id}`);
    });
    
    console.log('\nSchema fix completed successfully');
  } catch (error) {
    console.error('Error fixing schema:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the schema fix
fixSchema();
