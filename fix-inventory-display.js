// This script can be pasted into the browser console to fix the inventory display
// Copy and paste this into the browser console

console.log('Fixing inventory display...');

// Function to fetch inventory items from the server
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
      return null;
    }
    
    const data = await response.json();
    console.log(`Successfully retrieved ${data.length} items from /db/inventory endpoint`);
    
    if (data.length > 0) {
      console.log('First 5 items:');
      data.slice(0, 5).forEach((item, index) => {
        console.log(`Item ${index + 1}: ${item.name} (ID: ${item.id})`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return null;
  }
}

// Function to find the inventory context in the React component tree
function findInventoryContext() {
  // Try to find the inventory context in the global scope
  if (window.inventoryContext) {
    console.log('Found inventory context in global scope');
    return window.inventoryContext;
  }
  
  // Try to find the inventory context in the React component tree
  try {
    // Find all React components
    const allElements = document.querySelectorAll('*');
    
    // Look for elements with React properties
    for (const element of allElements) {
      const reactProps = Object.keys(element).find(key => 
        key.startsWith('__reactProps$') || 
        key.startsWith('__reactFiber$') || 
        key.startsWith('__reactContainer$')
      );
      
      if (reactProps) {
        const props = element[reactProps];
        
        // Check if this element has inventory context
        if (props && props.value && props.value.inventoryItems) {
          console.log('Found inventory context in React component');
          return props.value;
        }
      }
    }
    
    console.log('Could not find inventory context in React component tree');
    return null;
  } catch (error) {
    console.error('Error finding inventory context:', error);
    return null;
  }
}

// Function to update the inventory items in the UI
async function updateInventoryItems() {
  // Fetch inventory items from the server
  const items = await fetchInventoryItems();
  
  if (!items) {
    console.error('Failed to fetch inventory items');
    return;
  }
  
  // Find the inventory context
  const inventoryContext = findInventoryContext();
  
  if (!inventoryContext) {
    console.error('Could not find inventory context');
    
    // Try to force a refresh of the page
    console.log('Trying to force a refresh of the page...');
    
    // Store the items in localStorage
    localStorage.setItem('fixedInventoryItems', JSON.stringify(items));
    
    // Reload the page
    window.location.reload();
    return;
  }
  
  // Update the inventory items in the context
  console.log(`Updating inventory context with ${items.length} items`);
  
  // Check if the context has a setInventoryItems function
  if (inventoryContext.setInventoryItems) {
    inventoryContext.setInventoryItems(items);
    console.log('Updated inventory items using setInventoryItems function');
  } else {
    // Try to update the items directly
    inventoryContext.inventoryItems = items;
    console.log('Updated inventory items directly');
  }
  
  // Force a re-render
  console.log('Forcing a re-render...');
  
  // Try to find a button or link to click to force a re-render
  const buttons = document.querySelectorAll('button');
  let refreshButton = null;
  
  for (const button of buttons) {
    if (button.textContent.includes('Refresh') || 
        button.textContent.includes('Reload') || 
        button.textContent.includes('Update')) {
      refreshButton = button;
      break;
    }
  }
  
  if (refreshButton) {
    console.log('Found refresh button, clicking it...');
    refreshButton.click();
  } else {
    console.log('Could not find refresh button');
    
    // Try to force a re-render by changing the URL hash
    console.log('Changing URL hash to force a re-render...');
    window.location.hash = Date.now().toString();
  }
  
  return items;
}

// Run the update function
const updatedItems = await updateInventoryItems();

// Store the updated items in a global variable for inspection
window.updatedItems = updatedItems;

console.log('Inventory display fix complete');
console.log('Check the page to see if all items are now displayed');
console.log('If not, try refreshing the page');

// Return the updated items
updatedItems;
