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

async function checkSchema() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to Neon PostgreSQL database');

    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n=== Tables ===');
    tablesResult.rows.forEach(row => {
      console.log(row.table_name);
    });

    // For each table, get its columns
    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name;
      
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);
      
      console.log(`\n=== Columns for ${tableName} ===`);
      columnsResult.rows.forEach(column => {
        console.log(`${column.column_name} (${column.data_type})${column.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}${column.column_default ? ' DEFAULT ' + column.column_default : ''}`);
      });
    }

    console.log('\nSchema check completed successfully');
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the schema check
checkSchema();
