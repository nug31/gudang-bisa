// This script can be pasted into the browser console to test the database connection
// Copy and paste this into the browser console

console.log('Testing database connection...');

// Function to test the database connection
async function testDatabaseConnection() {
  try {
    // Test the /db/users endpoint
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
      console.log('Users:', usersData);
      return true;
    } else {
      console.error(`Error: ${usersResponse.status} ${usersResponse.statusText}`);
      console.log('Response text:', await usersResponse.text());
      return false;
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
    return false;
  }
}

// Function to fix the database connection
async function fixDatabaseConnection() {
  console.log('Attempting to fix database connection...');
  
  // Try to fetch users from the server
  try {
    const response = await fetch('/db/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getAll',
      }),
    });
    
    if (response.ok) {
      const users = await response.json();
      console.log(`Successfully retrieved ${users.length} users from /db/users endpoint`);
      
      // Find the error message element
      const errorElement = document.querySelector('.bg-error-50');
      if (errorElement) {
        console.log('Found error message element, removing it...');
        errorElement.style.display = 'none';
      }
      
      // Find the retry button and click it
      const retryButton = document.querySelector('button[aria-label="Retry"]') || 
                          document.querySelector('button:has(.refresh-cw)') ||
                          Array.from(document.querySelectorAll('button')).find(btn => 
                            btn.textContent.includes('Retry') || 
                            btn.innerHTML.includes('RefreshCw')
                          );
      
      if (retryButton) {
        console.log('Found retry button, clicking it...');
        retryButton.click();
      } else {
        console.log('Could not find retry button');
        
        // Try to force a refresh
        console.log('Forcing a refresh...');
        window.location.reload();
      }
      
      return true;
    } else {
      console.error(`Error: ${response.status} ${response.statusText}`);
      console.log('Response text:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Error fixing database connection:', error);
    return false;
  }
}

// Run the test
const connectionSuccessful = await testDatabaseConnection();

// If the test fails, try to fix the connection
if (!connectionSuccessful) {
  console.log('Database connection test failed, attempting to fix...');
  await fixDatabaseConnection();
} else {
  console.log('Database connection test successful!');
}

// Return the result
connectionSuccessful;
