// Test script to check the db-inventory endpoint
const fetch = require('node-fetch');
require('dotenv').config();

async function testDbInventoryEndpoint() {
  try {
    console.log('Testing /db/inventory endpoint...');
    
    // Make a request to the endpoint
    const response = await fetch('http://localhost:3001/db/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getAll',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const text = await response.text();
    if (!text) {
      throw new Error('Empty response from server');
    }
    
    const data = JSON.parse(text);
    console.log(`Successfully retrieved ${data.length} inventory items from endpoint`);
    
    // Display the first 5 items
    if (data.length > 0) {
      console.log('First 5 items:');
      data.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} (${item.categoryName}) - Quantity: ${item.quantityAvailable}`);
      });
    }
    
    return {
      success: true,
      itemCount: data.length,
      items: data.slice(0, 5),
    };
  } catch (error) {
    console.error('Error testing endpoint:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the test
testDbInventoryEndpoint()
  .then((result) => {
    console.log('Test completed:', result.success ? 'SUCCESS' : 'FAILED');
    if (result.success) {
      console.log(`Retrieved ${result.itemCount} items from the endpoint`);
    } else {
      console.error('Error:', result.error);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
