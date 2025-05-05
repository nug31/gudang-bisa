import mysql from "mysql2/promise";
import fs from "fs/promises";
import { config } from "dotenv";
import path from "path";

// Load environment variables
config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function initDatabase() {
  console.log("Starting database initialization...");

  // Create connection
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  });

  try {
    console.log("Connected to database.");

    // We'll use only the second migration file which has the correct schema for MySQL
    const migrationFile = path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "20250501074542_sweet_swamp.sql"
    );

    console.log(`Executing migration: 20250501074542_sweet_swamp.sql`);
    const sql = await fs.readFile(migrationFile, "utf8");

    await connection.query(sql);
    console.log(`Migration executed successfully.`);

    console.log("Database initialization completed successfully.");

    // Export the initialized database
    console.log("Exporting the initialized database...");
    await exportDatabase(connection);
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    await connection.end();
  }
}

async function exportDatabase(connection) {
  try {
    // Get all tables
    const [tables] = await connection.query("SHOW TABLES");
    const tableNames = tables.map((table) => Object.values(table)[0]);

    console.log(`Found ${tableNames.length} tables: ${tableNames.join(", ")}`);

    let sqlOutput = "";

    // Add drop table statements
    for (const tableName of tableNames) {
      sqlOutput += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    }

    // Get create table statements
    for (const tableName of tableNames) {
      console.log(`Processing table: ${tableName}`);

      // Get create table statement
      const [createTableResult] = await connection.query(
        `SHOW CREATE TABLE \`${tableName}\``
      );
      const createTableSql = createTableResult[0]["Create Table"];

      sqlOutput += `\n${createTableSql};\n\n`;
    }

    // Write to file
    await fs.writeFile("database_backup.sql", sqlOutput);
    console.log(
      "Database export completed successfully. Saved to database_backup.sql"
    );
  } catch (error) {
    console.error("Error exporting database:", error);
  }
}

initDatabase();
