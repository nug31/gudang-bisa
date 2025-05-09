import fetch from 'node-fetch';

async function testInventoryApi() {
  console.log('Testing inventory API endpoints...');
  
  // Test the /db/inventory endpoint
  try {
    console.log('\nTesting /db/inventory endpoint...');
    const dbResponse = await fetch('http://localhost:3003/db/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getAll',
      }),
    });
    
    if (!dbResponse.ok) {
      console.error(`Error: ${dbResponse.status} ${dbResponse.statusText}`);
    } else {
      const dbData = await dbResponse.json();
      console.log(`Successfully retrieved ${dbData.length} items from /db/inventory`);
      if (dbData.length > 0) {
        console.log('Sample item:', dbData[0]);
      }
    }
  } catch (error) {
    console.error('Error testing /db/inventory endpoint:', error);
  }
  
  // Test the /api/inventory endpoint
  try {
    console.log('\nTesting /api/inventory endpoint...');
    const apiResponse = await fetch('http://localhost:3003/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getAll',
      }),
    });
    
    if (!apiResponse.ok) {
      console.error(`Error: ${apiResponse.status} ${apiResponse.statusText}`);
    } else {
      const apiData = await apiResponse.json();
      console.log(`Successfully retrieved ${apiData.length} items from /api/inventory`);
      if (apiData.length > 0) {
        console.log('Sample item:', apiData[0]);
      }
    }
  } catch (error) {
    console.error('Error testing /api/inventory endpoint:', error);
  }
}

testInventoryApi();
