import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

async function testSimpleServer() {
  console.log('Testing simple server...');
  
  try {
    // Create a test request
    const requestData = {
      id: uuidv4(),
      title: 'Test Request for Simple Server',
      description: 'This is a test request for the simple server',
      category: '1f34fae5-830b-4c6c-9092-7ea7c1f11433', // Hardware category ID
      priority: 'medium',
      status: 'pending',
      userId: '733dce62-3971-4448-8fc7-2d5e77928b00', // Admin user ID
      quantity: 1
    };
    
    console.log('Sending request data:', requestData);
    
    const response = await fetch('http://localhost:3002/api/create-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (!responseText.trim()) {
      console.log('Response is empty');
    } else {
      try {
        const responseData = JSON.parse(responseText);
        console.log('Request created successfully:', responseData);
      } catch (e) {
        console.error('Could not parse response as JSON:', e.message);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testSimpleServer();
