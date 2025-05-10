// Client Database Test Script
// This script tests the database connection and attempts to fix any issues

console.log('Running Gudang Mitra Database Test Script...');

// Function to test the database connection
async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  // Test the /db/users endpoint
  try {
    console.log('Testing /db/users endpoint...');
    const usersResponse = await fetch('/db/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getAll',
      }),
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`Successfully retrieved ${usersData.length} users from /db/users endpoint`);
      console.log('First 3 users:', usersData.slice(0, 3));
      
      // Test the /db/inventory endpoint
      console.log('Testing /db/inventory endpoint...');
      const inventoryResponse = await fetch('/db/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getAll',
        }),
      });
      
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        console.log(`Successfully retrieved ${inventoryData.length} inventory items from /db/inventory endpoint`);
        console.log('First 3 items:', inventoryData.slice(0, 3));
        
        // Test the /db/categories endpoint
        console.log('Testing /db/categories endpoint...');
        const categoriesResponse = await fetch('/db/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'getAll',
          }),
        });
        
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          console.log(`Successfully retrieved ${categoriesData.length} categories from /db/categories endpoint`);
          console.log('Categories:', categoriesData);
          
          return {
            success: true,
            users: usersData,
            inventory: inventoryData,
            categories: categoriesData,
          };
        } else {
          console.error(`Error with /db/categories endpoint: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
          return {
            success: false,
            error: `Categories endpoint failed: ${categoriesResponse.status} ${categoriesResponse.statusText}`,
          };
        }
      } else {
        console.error(`Error with /db/inventory endpoint: ${inventoryResponse.status} ${inventoryResponse.statusText}`);
        return {
          success: false,
          error: `Inventory endpoint failed: ${inventoryResponse.status} ${inventoryResponse.statusText}`,
        };
      }
    } else {
      console.error(`Error with /db/users endpoint: ${usersResponse.status} ${usersResponse.statusText}`);
      return {
        success: false,
        error: `Users endpoint failed: ${usersResponse.status} ${usersResponse.statusText}`,
      };
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
    return {
      success: false,
      error: `Connection error: ${error.message}`,
    };
  }
}

// Function to fix the database connection
async function fixDatabaseConnection() {
  console.log('Attempting to fix database connection...');
  
  // Find the error message element
  const errorElement = document.querySelector('.bg-error-50');
  if (errorElement) {
    console.log('Found error message element:', errorElement.textContent);
    
    // Find the retry button
    const retryButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Retry') || 
      btn.innerHTML.includes('RefreshCw')
    );
    
    if (retryButton) {
      console.log('Found retry button, clicking it...');
      retryButton.click();
      
      // Wait for the page to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if the error message is still there
      const errorElementAfterRetry = document.querySelector('.bg-error-50');
      if (!errorElementAfterRetry) {
        console.log('Error message is gone, retry was successful!');
        return true;
      } else {
        console.log('Error message is still there, retry was not successful.');
      }
    } else {
      console.log('Could not find retry button');
    }
    
    // If retry button doesn't work or doesn't exist, try to hide the error message
    console.log('Hiding error message...');
    errorElement.style.display = 'none';
  } else {
    console.log('No error message element found');
  }
  
  // Try to force a refresh
  console.log('Forcing a refresh...');
  window.location.reload();
  
  return false;
}

// Run the test
async function runTest() {
  const result = await testDatabaseConnection();
  
  if (result.success) {
    console.log('Database connection test successful!');
    console.log('Summary:');
    console.log(`- Users: ${result.users.length}`);
    console.log(`- Inventory Items: ${result.inventory.length}`);
    console.log(`- Categories: ${result.categories.length}`);
    
    // Create a visual indicator of success
    const successDiv = document.createElement('div');
    successDiv.style.position = 'fixed';
    successDiv.style.top = '10px';
    successDiv.style.right = '10px';
    successDiv.style.padding = '10px';
    successDiv.style.backgroundColor = '#d4edda';
    successDiv.style.color = '#155724';
    successDiv.style.borderRadius = '5px';
    successDiv.style.zIndex = '9999';
    successDiv.innerHTML = `
      <strong>Database Connection Successful!</strong><br>
      Users: ${result.users.length}<br>
      Inventory Items: ${result.inventory.length}<br>
      Categories: ${result.categories.length}
    `;
    document.body.appendChild(successDiv);
    
    // Remove the indicator after 5 seconds
    setTimeout(() => {
      document.body.removeChild(successDiv);
    }, 5000);
    
    return result;
  } else {
    console.error('Database connection test failed:', result.error);
    
    // Try to fix the connection
    console.log('Attempting to fix the connection...');
    await fixDatabaseConnection();
    
    return result;
  }
}

// Run the test and store the result in a global variable
window.dbTestResult = runTest();

// Return a message to the console
console.log('Database test script loaded and running. Check the console for results.');
console.log('The test result will be stored in window.dbTestResult');
