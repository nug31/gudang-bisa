import fetch from 'node-fetch';

async function testHybridApi() {
  try {
    // Test hybrid login
    console.log('Testing hybrid login...');
    const hybridLoginResponse = await fetch('http://localhost:3001/api/hybrid-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'admin@example.com', 
        password: 'password' 
      }),
    });
    
    if (hybridLoginResponse.ok) {
      const hybridLoginData = await hybridLoginResponse.json();
      console.log('Hybrid login response:', hybridLoginData);
      console.log('Using mock database:', hybridLoginData.usingMock);
      
      // Store the user for later use
      const user = hybridLoginData.user;
      
      // Test getting requests for this user
      console.log('\nTesting requests for user:', user.id);
      const requestsResponse = await fetch('http://localhost:3001/db/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'getAll',
          userId: user.id
        }),
      });
      
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        console.log(`Found ${requestsData.length} requests for user ${user.id}:`);
        requestsData.forEach(request => {
          console.log(`- ${request.id}: ${request.title} (${request.status})`);
        });
      } else {
        console.log('Failed to get requests with status:', requestsResponse.status);
      }
    } else {
      console.log('Hybrid login failed with status:', hybridLoginResponse.status);
      console.log('Response text:', await hybridLoginResponse.text());
    }
  } catch (error) {
    console.error('Error testing hybrid API:', error);
  }
}

testHybridApi();
