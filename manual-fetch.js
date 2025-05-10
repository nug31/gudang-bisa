// This script can be pasted into the browser console to manually fetch inventory items
// Copy and paste this into the browser console

console.log('Manually fetching inventory items...');

async function fetchInventoryItems() {
  try {
    console.log('Fetching inventory items from /db/inventory endpoint...');
    const response = await fetch('/db/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getAll',
      }),
    });
    
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`Successfully retrieved ${data.length} items from /db/inventory endpoint`);
    
    if (data.length > 0) {
      console.log('All items:');
      data.forEach((item, index) => {
        console.log(`Item ${index + 1}: ${item.name} (ID: ${item.id})`);
      });
      
      // Store the items in a global variable for easy access
      window.manuallyFetchedItems = data;
      console.log('Items stored in window.manuallyFetchedItems');
      
      // Try to update the UI with these items
      console.log('Attempting to update the UI with these items...');
      
      // Check if we can find the inventory context
      if (window.inventoryContext) {
        console.log('Found inventory context, updating items...');
        window.inventoryContext.setInventoryItems(data);
        console.log('Items updated in inventory context');
      } else {
        console.log('Inventory context not found in global scope');
        
        // Try to find React components that might be using the inventory items
        console.log('Looking for React components that might be using inventory items...');
        
        // This is a simple approach that might not work in all cases
        // A more robust approach would require knowledge of the component structure
        const possibleComponents = Array.from(document.querySelectorAll('*')).filter(el => {
          return el._reactRootContainer || el.__reactInternalInstance$ || el.__reactFiber$;
        });
        
        if (possibleComponents.length > 0) {
          console.log(`Found ${possibleComponents.length} possible React components`);
          console.log('Components:', possibleComponents);
        } else {
          console.log('No React components found');
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching inventory items:', error);
  }
}

// Execute the function
fetchInventoryItems();
