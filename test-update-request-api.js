import fetch from 'node-fetch';

async function testUpdateRequestApi() {
  try {
    console.log('Testing update request API...');
    
    // First, get all requests to find one to update
    const getAllResponse = await fetch('http://localhost:3001/db/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getAll',
      }),
    });
    
    if (!getAllResponse.ok) {
      throw new Error(`Failed to get requests: ${getAllResponse.status} ${getAllResponse.statusText}`);
    }
    
    const requests = await getAllResponse.json();
    console.log(`Found ${requests.length} requests`);
    
    if (requests.length === 0) {
      console.log('No requests found to update');
      return;
    }
    
    // Select the first request to update
    const requestToUpdate = requests[0];
    console.log('Request to update:', requestToUpdate);
    
    // Update the request status
    const newStatus = requestToUpdate.status === 'pending' ? 'approved' : 'pending';
    console.log(`Updating request status from ${requestToUpdate.status} to ${newStatus}`);
    
    const updatedRequest = {
      ...requestToUpdate,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    
    // Send the update request
    const updateResponse = await fetch('http://localhost:3001/db/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        request: updatedRequest,
      }),
    });
    
    console.log('Update response status:', updateResponse.status);
    
    if (updateResponse.ok) {
      const result = await updateResponse.json();
      console.log('Update result:', result);
      console.log('Status updated successfully:', result.status === newStatus);
    } else {
      console.error('Update failed:', await updateResponse.text());
    }
  } catch (error) {
    console.error('Error testing update request API:', error);
  }
}

testUpdateRequestApi();
