import pool from './index';
import { readFileSync } from 'fs';
import { join } from 'path';

async function createTables() {
  try {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    const connection = await pool.getConnection();
    
    console.log('Creating database tables...');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .filter(statement => statement.trim().length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      await connection.query(statement);
    }
    
    console.log('✅ Database tables created successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Error creating database tables:', error);
    process.exit(1);
  }
}

createTables();