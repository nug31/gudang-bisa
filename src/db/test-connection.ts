import pool from './index';

async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL database!');
    
    // Test a simple query
    const [result] = await connection.query('SELECT 1 + 1 AS test');
    console.log('✅ Successfully executed test query:', result);
    
    connection.release();
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

testDatabaseConnection();