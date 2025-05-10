import pg from 'pg';
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

async function checkCommentsTable() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to Neon PostgreSQL database');

    // Check if the comments table exists
    const tableExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'comments'
      );
    `);

    const commentsTableExists = tableExistsResult.rows[0].exists;
    console.log(`Comments table exists: ${commentsTableExists}`);

    if (!commentsTableExists) {
      console.log('Creating comments table...');
      
      // Create the comments table
      await client.query(`
        CREATE TABLE comments (
          id UUID PRIMARY KEY,
          item_request_id UUID NOT NULL REFERENCES item_requests(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id),
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      console.log('Comments table created successfully');
    } else {
      // Get the schema of the comments table
      const commentsSchemaResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'comments'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n=== Comments Table Schema ===');
      commentsSchemaResult.rows.forEach(column => {
        console.log(`- ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    }

    console.log('\nCheck completed successfully');
  } catch (error) {
    console.error('Error checking comments table:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the check
checkCommentsTable();
