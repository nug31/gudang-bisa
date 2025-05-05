import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import { config } from 'dotenv';

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function exportDatabase() {
  console.log('Starting database export...');
  
  // Create connection
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('Connected to database. Fetching tables...');
    
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    
    console.log(`Found ${tableNames.length} tables: ${tableNames.join(', ')}`);
    
    let sqlOutput = '';
    
    // Add drop table statements
    for (const tableName of tableNames) {
      sqlOutput += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    }
    
    // Get create table statements and data
    for (const tableName of tableNames) {
      console.log(`Processing table: ${tableName}`);
      
      // Get create table statement
      const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createTableSql = createTableResult[0]['Create Table'];
      
      sqlOutput += `\n${createTableSql};\n\n`;
      
      // Get table data
      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        // Generate insert statements
        const columns = Object.keys(rows[0]);
        const columnsSql = columns.map(col => `\`${col}\``).join(', ');
        
        sqlOutput += `INSERT INTO \`${tableName}\` (${columnsSql}) VALUES\n`;
        
        const valuesSql = rows.map(row => {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'number') return value;
            if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return `'${value.toString().replace(/'/g, "''")}'`;
          });
          return `(${values.join(', ')})`;
        }).join(',\n');
        
        sqlOutput += `${valuesSql};\n\n`;
      }
    }
    
    // Write to file
    await fs.writeFile('database_backup.sql', sqlOutput);
    console.log('Database export completed successfully. Saved to database_backup.sql');
    
  } catch (error) {
    console.error('Error exporting database:', error);
  } finally {
    await connection.end();
  }
}

exportDatabase();
