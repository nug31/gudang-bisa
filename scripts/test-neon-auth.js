import { config } from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

// Load environment variables
config();

// Neon connection details
const connectionString = process.env.NEON_CONNECTION_STRING;

if (!connectionString) {
  console.error('Missing Neon connection string. Please set NEON_CONNECTION_STRING in your .env file.');
  process.exit(1);
}

async function testNeonAuth() {
  console.log('Testing Neon database authentication...');
  
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
    
    // Check if admin user exists
    const email = 'admin@gudangmitra.com';
    const password = 'admin123';
    
    console.log(`Checking if user with email ${email} exists...`);
    
    const result = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('User not found in database.');
      
      // Create admin user
      console.log('Creating admin user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert admin user
      await client.query(
        `INSERT INTO users (id, name, email, password, role, department, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          '00000000-0000-0000-0000-000000000001',
          'Admin User',
          email,
          hashedPassword,
          'admin',
          'IT',
          new Date().toISOString()
        ]
      );
      
      console.log('Admin user created successfully.');
    } else {
      console.log('User found in database:', {
        id: result.rows[0].id,
        email: result.rows[0].email,
        role: result.rows[0].role
      });
      
      // Test password
      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      console.log('Password validation result:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('Updating password...');
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update password
        await client.query(
          `UPDATE users SET password = $1 WHERE id = $2`,
          [hashedPassword, user.id]
        );
        
        console.log('Password updated successfully.');
      }
    }
    
    console.log('Neon database authentication test completed successfully!');
    
  } catch (error) {
    console.error('Error testing Neon authentication:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the test
testNeonAuth().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
