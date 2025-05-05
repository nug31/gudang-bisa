import fetch from 'node-fetch';

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    // Test login with admin account
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
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testAdminLogin();
