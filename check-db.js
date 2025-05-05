import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function checkDatabase() {
  console.log('Checking database structure...');
  
  // Create connection
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  });

  try {
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:');
    tables.forEach(table => console.log('- ' + Object.values(table)[0]));
    
    // Check each table structure
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`\nStructure of ${tableName}:`);
      
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      columns.forEach(col => {
        console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key === 'PRI' ? 'PRIMARY KEY' : ''}`);
      });
      
      // Get foreign keys
      try {
        const [foreignKeys] = await connection.query(`
          SELECT 
            COLUMN_NAME, 
            REFERENCED_TABLE_NAME, 
            REFERENCED_COLUMN_NAME 
          FROM 
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE 
            TABLE_SCHEMA = ? AND 
            TABLE_NAME = ? AND 
            REFERENCED_TABLE_NAME IS NOT NULL
        `, [DB_NAME, tableName]);
        
        if (foreignKeys.length > 0) {
          console.log('\nForeign Keys:');
          foreignKeys.forEach(fk => {
            console.log(`- ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}(${fk.REFERENCED_COLUMN_NAME})`);
          });
        }
      } catch (error) {
        console.error(`Error getting foreign keys for ${tableName}:`, error);
      }
    }
    
    // Check if we have any categories
    const [categories] = await connection.query('SELECT * FROM categories');
    console.log('\nCategories:');
    if (categories.length === 0) {
      console.log('No categories found!');
    } else {
      categories.forEach(cat => {
        console.log(`- ${cat.id}: ${cat.name}`);
      });
    }
    
    // Check if we have any users
    const [users] = await connection.query('SELECT * FROM users');
    console.log('\nUsers:');
    if (users.length === 0) {
      console.log('No users found!');
    } else {
      users.forEach(user => {
        console.log(`- ${user.id}: ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await connection.end();
  }
}

checkDatabase();
