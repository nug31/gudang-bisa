import fetch from 'node-fetch';

async function testDirectConnection() {
  try {
    console.log('Testing direct connection to server...');
    
    // Test login
    const loginResponse = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password',
      }),
    });
    
    console.log('Login response status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Login successful:', loginData);
    } else {
      console.error('Login failed:', await loginResponse.text());
    }
    
    // Test registration
    const timestamp = new Date().getTime();
    const registerResponse = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Test User ${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: 'password123',
        role: 'user',
        department: 'Testing',
      }),
    });
    
    console.log('Register response status:', registerResponse.status);
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('Registration successful:', registerData);
    } else {
      console.error('Registration failed:', await registerResponse.text());
    }
    
  } catch (error) {
    console.error('Error testing connection:', error);
  }
}

testDirectConnection();
