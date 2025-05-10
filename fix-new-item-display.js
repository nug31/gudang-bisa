// Script to fix issues with new items not appearing in the inventory list
// Run this script in the browser console if new items aren't showing up

(function() {
  console.log("=== New Item Display Fix ===");
  console.log("Attempting to fix issues with new items not appearing...");
  
  // Find the inventory context
  function findInventoryContext() {
    // Look for React components with inventory-related state
    let foundContext = null;
    
    // Check if we have direct access to the inventory context
    if (window.inventoryContext) {
      console.log("Found global inventory context");
      return window.inventoryContext;
    }
    
    // Try to find inventory-related functions in the window object
    const inventoryFunctions = Object.keys(window).filter(key => 
      key.toLowerCase().includes('inventory') && typeof window[key] === 'function'
    );
    
    if (inventoryFunctions.length > 0) {
      console.log("Found inventory-related functions:", inventoryFunctions);
    }
    
    return null;
  }
  
  // Force a refresh of the inventory items
  async function forceRefresh() {
    console.log("Forcing refresh of inventory items...");
    
    try {
      // Try to fetch inventory items directly
      const response = await fetch("/db/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "getAll",
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory items: ${response.status}`);
      }
      
      const items = await response.json();
      console.log(`Successfully fetched ${items.length} inventory items`);
      
      // Try to update the inventory context
      const context = findInventoryContext();
      if (context && context.setInventoryItems) {
        context.setInventoryItems(items);
        console.log("Updated inventory context with fetched items");
      }
      
      return items;
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      return null;
    }
  }
  
  // Try to click any refresh buttons on the page
  function clickRefreshButtons() {
    // Look for buttons with refresh-related text or icons
    const refreshButtons = Array.from(document.querySelectorAll('button')).filter(button => {
      const buttonText = button.textContent.toLowerCase();
      return buttonText.includes('refresh') || 
             buttonText.includes('reload') || 
             buttonText.includes('update');
    });
    
    if (refreshButtons.length > 0) {
      console.log(`Found ${refreshButtons.length} refresh buttons`);
      refreshButtons.forEach(button => {
        console.log(`Clicking button: ${button.textContent}`);
        button.click();
      });
      return true;
    }
    
    return false;
  }
  
  // Try to force a re-render by changing the URL
  function forceRerender() {
    console.log("Forcing re-render by changing URL hash...");
    
    // Store current URL
    const currentUrl = window.location.href;
    const currentHash = window.location.hash;
    
    // Add a timestamp to force a refresh
    const newHash = `#_t=${Date.now()}`;
    window.location.hash = newHash;
    
    // Restore the original hash after a short delay
    setTimeout(() => {
      window.location.hash = currentHash || '';
      console.log("Restored original URL hash");
    }, 100);
  }
  
  // Main function to fix new item display issues
  async function fixNewItemDisplay() {
    // First try to force a refresh
    const items = await forceRefresh();
    
    // Then try to click any refresh buttons
    const clickedButtons = clickRefreshButtons();
    
    // Finally, try to force a re-render
    forceRerender();
    
    // Add a message to the console
    console.log("\nNew item display fix attempted!");
    console.log("If items still don't appear, try the following:");
    console.log("1. Reload the page completely");
    console.log("2. Check the browser console for errors");
    console.log("3. Verify that the database connection is working");
    console.log("4. Check if the item was actually saved to the database");
    
    return items;
  }
  
  // Run the fix
  return fixNewItemDisplay();
})();
