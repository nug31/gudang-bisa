import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

async function createRequest() {
  try {
    // First, login to get the user ID
    console.log('Logging in as admin...');
    const loginResponse = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'admin@example.com', 
        password: 'password' 
      }),
    });
    
    if (!loginResponse.ok) {
      console.log('Login failed with status:', loginResponse.status);
      return;
    }
    
    const loginData = await loginResponse.json();
    const userId = loginData.user.id;
    console.log('Logged in as user ID:', userId);
    
    // Get categories
    console.log('\nGetting categories...');
    const categoriesResponse = await fetch('http://localhost:3001/db/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'getAll'
      }),
    });
    
    if (!categoriesResponse.ok) {
      console.log('Failed to get categories with status:', categoriesResponse.status);
      return;
    }
    
    const categories = await categoriesResponse.json();
    console.log(`Found ${categories.length} categories`);
    
    if (categories.length === 0) {
      console.log('No categories found, cannot create request');
      return;
    }
    
    const categoryId = categories[0].id;
    console.log('Using category:', categories[0].name, '(ID:', categoryId, ')');
    
    // Create a new request
    console.log('\nCreating new request...');
    const newRequest = {
      id: uuidv4(),
      title: 'Test Request from Admin',
      description: 'This is a test request created by the admin user',
      category: categoryId,
      priority: 'medium',
      status: 'pending',
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      quantity: 1
    };
    
    const createResponse = await fetch('http://localhost:3001/db/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'create',
        request: newRequest
      }),
    });
    
    if (!createResponse.ok) {
      console.log('Failed to create request with status:', createResponse.status);
      console.log('Response text:', await createResponse.text());
      return;
    }
    
    const createdRequest = await createResponse.json();
    console.log('Request created successfully:', createdRequest);
    
    // Get all requests to verify
    console.log('\nVerifying requests...');
    const requestsResponse = await fetch('http://localhost:3001/db/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'getAll'
      }),
    });
    
    if (!requestsResponse.ok) {
      console.log('Failed to get requests with status:', requestsResponse.status);
      return;
    }
    
    const requests = await requestsResponse.json();
    console.log(`Found ${requests.length} total requests:`);
    requests.forEach(request => {
      console.log(`- ${request.id}: ${request.title} (${request.status}) - User: ${request.userId}`);
    });
    
    // Filter requests for the current user
    const userRequests = requests.filter(request => request.userId === userId);
    console.log(`\nFound ${userRequests.length} requests for user ${userId}:`);
    userRequests.forEach(request => {
      console.log(`- ${request.id}: ${request.title} (${request.status})`);
    });
  } catch (error) {
    console.error('Error creating request:', error);
  }
}

createRequest();
