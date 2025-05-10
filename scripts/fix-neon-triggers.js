import { config } from 'dotenv';
import pg from 'pg';

// Load environment variables
config();

// Neon connection details
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error('Missing Neon connection string. Please set NEON_CONNECTION_STRING in your .env file.');
  process.exit(1);
}

async function fixNeonTriggers() {
  console.log('Fixing Neon database triggers...');
  
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
    
    // Create the trigger function as a single statement
    const createFunctionSQL = `
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;
    `;
    
    console.log('Creating trigger function...');
    await client.query(createFunctionSQL);
    console.log('Trigger function created successfully.');
    
    // Create triggers
    const createTriggersSQL = [
      `CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
      `CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
      `CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
      `CREATE TRIGGER update_item_requests_updated_at BEFORE UPDATE ON item_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`
    ];
    
    // Execute each trigger creation
    for (let i = 0; i < createTriggersSQL.length; i++) {
      try {
        console.log(`Creating trigger ${i + 1}...`);
        await client.query(createTriggersSQL[i]);
        console.log(`Trigger ${i + 1} created successfully.`);
      } catch (error) {
        // If trigger already exists, that's fine
        if (error.code === '42710') { // duplicate_object
          console.log(`Trigger ${i + 1} already exists.`);
        } else {
          console.error(`Error creating trigger ${i + 1}:`, error);
        }
      }
    }
    
    console.log('Neon database triggers fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing Neon triggers:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the function
fixNeonTriggers().catch(error => {
  console.error('Failed to fix triggers:', error);
  process.exit(1);
});
