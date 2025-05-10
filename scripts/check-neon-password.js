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

async function checkNeonPassword() {
  console.log('Checking Neon database password...');
  
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
    
    // Check admin user
    const email = 'admin@gudangmitra.com';
    const password = 'admin123';
    
    console.log(`Checking user with email ${email}...`);
    
    const result = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('User not found in database.');
      return;
    }
    
    const user = result.rows[0];
    console.log('User found in database:', {
      id: user.id,
      email: user.email,
      role: user.role,
      password: user.password
    });
    
    // Create a new password hash
    const newHashedPassword = await bcrypt.hash(password, 10);
    console.log('New hashed password:', newHashedPassword);
    
    // Test password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isPasswordValid);
    
    // Force update password
    console.log('Forcing password update...');
    
    // Update password
    await client.query(
      `UPDATE users SET password = $1 WHERE id = $2`,
      [newHashedPassword, user.id]
    );
    
    console.log('Password updated successfully.');
    
    // Verify the update
    const updatedResult = await client.query(
      "SELECT * FROM users WHERE id = $1",
      [user.id]
    );
    
    const updatedUser = updatedResult.rows[0];
    console.log('Updated user password:', updatedUser.password);
    
    // Test updated password
    const isUpdatedPasswordValid = await bcrypt.compare(password, updatedUser.password);
    console.log('Updated password validation result:', isUpdatedPasswordValid);
    
  } catch (error) {
    console.error('Error checking Neon password:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the check
checkNeonPassword().catch(error => {
  console.error('Check failed:', error);
  process.exit(1);
});
