import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config();

async function testRequestUpdate() {
  try {
    console.log('Testing request update functionality...');
    
    // Step 1: Get all requests
    console.log('Fetching all requests...');
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
      throw new Error(`Failed to fetch requests: ${getAllResponse.status} ${getAllResponse.statusText}`);
    }
    
    const requests = await getAllResponse.json();
    console.log(`Found ${requests.length} requests`);
    
    if (requests.length === 0) {
      console.log('No requests found to update. Test cannot continue.');
      return;
    }
    
    // Step 2: Select the first request to update
    const requestToUpdate = requests[0];
    console.log('Request to update:', requestToUpdate);
    
    // Step 3: Update the request status
    const newStatus = requestToUpdate.status === 'pending' ? 'approved' : 'pending';
    console.log(`Updating request status from ${requestToUpdate.status} to ${newStatus}`);
    
    const updatedRequest = {
      ...requestToUpdate,
      status: newStatus,
      approvedBy: newStatus === 'approved' ? '00000000-0000-0000-0000-000000000001' : null,
      approvedAt: newStatus === 'approved' ? new Date().toISOString() : null,
    };
    
    // Step 4: Send the update request
    console.log('Sending update request...');
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
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Update failed: ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`);
    }
    
    const result = await updateResponse.json();
    console.log('Update result:', result);
    
    // Step 5: Verify the update
    console.log('Verifying update...');
    console.log('Status updated successfully:', result.status === newStatus);
    
    if (result.status !== newStatus) {
      console.error('Status was not updated correctly!');
    } else {
      console.log('Request update test passed successfully!');
    }
  } catch (error) {
    console.error('Error testing request update:', error);
  }
}

// Run the test
testRequestUpdate();
