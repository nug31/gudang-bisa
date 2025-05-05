import { config } from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
config();

async function exportForCloudPanel() {
  console.log('Exporting database for CloudPanel deployment...');
  
  try {
    // Create connection to local database
    console.log('Connecting to local database...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });
    
    console.log('Connected to database successfully.');
    
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    
    console.log(`Found ${tableNames.length} tables: ${tableNames.join(', ')}`);
    
    // Generate SQL for each table
    let sqlOutput = '-- Gudang Mitra Database Export for CloudPanel\n';
    sqlOutput += '-- Generated on ' + new Date().toISOString() + '\n\n';
    
    // Add SQL to create database if it doesn't exist
    sqlOutput += `-- Create database if it doesn't exist\n`;
    sqlOutput += `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
    sqlOutput += `USE \`${process.env.DB_NAME}\`;\n\n`;
    
    // Process each table
    for (const tableName of tableNames) {
      console.log(`Processing table: ${tableName}`);
      
      // Get table creation SQL
      const [tableSchema] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createTableSQL = tableSchema[0]['Create Table'];
      
      // Add drop table statement
      sqlOutput += `-- Table structure for table \`${tableName}\`\n`;
      sqlOutput += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlOutput += createTableSQL + ';\n\n';
      
      // Get table data
      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        sqlOutput += `-- Data for table \`${tableName}\`\n`;
        sqlOutput += `INSERT INTO \`${tableName}\` VALUES\n`;
        
        const values = rows.map(row => {
          const rowValues = Object.values(row).map(value => {
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (typeof value === 'object' && value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return value;
          });
          return '(' + rowValues.join(', ') + ')';
        });
        
        sqlOutput += values.join(',\n') + ';\n\n';
      }
    }
    
    // Close the connection
    await connection.end();
    
    // Write SQL to file
    const outputPath = path.join(process.cwd(), 'cloudpanel-database.sql');
    await fs.writeFile(outputPath, sqlOutput);
    
    console.log(`Database export completed successfully!`);
    console.log(`SQL file saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error exporting database:', error);
  }
}

exportForCloudPanel();
