import fetch from 'node-fetch';

async function testLoginApi() {
  console.log('Testing login API...');
  
  const email = 'admin@gudangmitra.com';
  const password = 'admin123';
  
  try {
    // Test API connection
    console.log('Testing API connection...');
    const testResponse = await fetch('http://localhost:3001/api/test');
    const testData = await testResponse.json();
    console.log('Test API response:', testData);
    
    // Test login API
    console.log('Testing login API...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log('Login API response status:', loginResponse.status);
    
    const responseText = await loginResponse.text();
    console.log('Login API response text:', responseText);
    
    try {
      const responseData = JSON.parse(responseText);
      console.log('Login API response data:', responseData);
    } catch (parseError) {
      console.error('Error parsing response as JSON:', parseError);
    }
    
    console.log('Login API test completed.');
  } catch (error) {
    console.error('Error testing login API:', error);
  }
}

// Run the test
testLoginApi().catch(error => {
  console.error('Test failed:', error);
});
