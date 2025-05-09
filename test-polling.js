const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testPollingMechanism() {
  try {
    console.log('Testing polling mechanism...');
    
    // 1. Create a new request
    const testRequest = {
      title: 'Polling Test Request ' + new Date().toISOString(),
      description: 'This is a test request to verify polling functionality',
      category: '1',
      priority: 'medium',
      status: 'pending',
      userId: '1',
      quantity: 1
    };
    
    console.log('Creating test request for polling test:', testRequest);
    
    const createResponse = await fetch('http://localhost:3001/db/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create',
        request: testRequest
      })
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create request: ${createResponse.status} ${createResponse.statusText}`);
    }
    
    const createdRequest = await createResponse.json();
    console.log('Successfully created request for polling test:', createdRequest);
    
    // 2. Wait for 15 seconds to allow polling to occur (polling interval is 10 seconds)
    console.log('Waiting for 15 seconds to allow polling to occur...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // 3. Update the request to trigger a change that should be detected by polling
    const updateData = {
      ...createdRequest,
      status: 'approved',
      description: 'Updated description for polling test'
    };
    
    console.log('Updating request to trigger polling detection:', updateData);
    
    const updateResponse = await fetch('http://localhost:3001/db/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update',
        request: updateData
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update request: ${updateResponse.status} ${updateResponse.statusText}`);
    }
    
    const updatedRequest = await updateResponse.json();
    console.log('Successfully updated request for polling test:', updatedRequest);
    
    // 4. Wait for another 15 seconds to allow polling to detect the change
    console.log('Waiting for another 15 seconds to allow polling to detect the change...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    console.log('Polling test completed. Check the server logs to verify that polling requests were made.');
  } catch (error) {
    console.error('Error testing polling mechanism:', error);
  }
}

testPollingMechanism();
