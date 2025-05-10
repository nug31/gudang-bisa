// Script to fix inventory display issues by forcing a refresh
// This script can be run in the browser console when items aren't appearing

(function() {
  console.log("=== Inventory Refresh Fix ===");
  console.log("Attempting to fix inventory display issues...");
  
  // Find the inventory context
  function findInventoryContext() {
    // Look for React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log("React DevTools found, attempting to find inventory context...");
    }
    
    // Try to find inventory context in React Fiber
    let inventoryContext = null;
    
    // Check if we have direct access to the inventory context
    if (window.inventoryContext) {
      console.log("Found global inventory context");
      return window.inventoryContext;
    }
    
    // Look for any inventory-related functions in the window object
    const inventoryFunctions = Object.keys(window).filter(key => 
      key.toLowerCase().includes('inventory') && typeof window[key] === 'function'
    );
    
    if (inventoryFunctions.length > 0) {
      console.log("Found inventory-related functions:", inventoryFunctions);
    }
    
    // Try to find the fetchInventoryItems function
    const fetchInventoryFunction = Object.keys(window).find(key => 
      key === 'fetchInventoryItems' || key === 'refreshInventory'
    );
    
    if (fetchInventoryFunction) {
      console.log(`Found fetch function: ${fetchInventoryFunction}`);
      try {
        window[fetchInventoryFunction]();
        console.log("Called fetch function directly");
        return true;
      } catch (error) {
        console.error("Error calling fetch function:", error);
      }
    }
    
    return null;
  }
  
  // Try to force a refresh by clicking the refresh button
  function clickRefreshButton() {
    // Look for buttons with refresh-related text or icons
    const refreshButtons = Array.from(document.querySelectorAll('button')).filter(button => {
      const buttonText = button.textContent.toLowerCase();
      const hasRefreshIcon = button.querySelector('svg') && 
        (button.innerHTML.includes('refresh') || button.innerHTML.includes('reload'));
      
      return buttonText.includes('refresh') || 
             buttonText.includes('reload') || 
             buttonText.includes('update') ||
             hasRefreshIcon;
    });
    
    if (refreshButtons.length > 0) {
      console.log(`Found ${refreshButtons.length} refresh buttons`);
      // Click the first refresh button
      refreshButtons[0].click();
      console.log("Clicked refresh button");
      return true;
    }
    
    // Look for import buttons as an alternative
    const importButtons = Array.from(document.querySelectorAll('button')).filter(button => {
      const buttonText = button.textContent.toLowerCase();
      return buttonText.includes('import');
    });
    
    if (importButtons.length > 0) {
      console.log("Found import button, might trigger a refresh");
      // Don't actually click it as it would open a modal
    }
    
    return false;
  }
  
  // Try to force a refresh by simulating navigation
  function simulateNavigation() {
    // Store current URL
    const currentUrl = window.location.href;
    
    // Add a timestamp to force a refresh
    const separator = currentUrl.includes('?') ? '&' : '?';
    const newUrl = `${currentUrl}${separator}_t=${Date.now()}`;
    
    console.log("Simulating navigation by updating URL");
    window.history.pushState({}, '', newUrl);
    
    // Dispatch a popstate event to trigger route change handlers
    try {
      window.dispatchEvent(new PopStateEvent('popstate'));
      console.log("Dispatched popstate event");
      
      // Restore the original URL after a short delay
      setTimeout(() => {
        window.history.pushState({}, '', currentUrl);
        console.log("Restored original URL");
      }, 100);
      
      return true;
    } catch (error) {
      console.error("Error dispatching popstate event:", error);
      // Restore the original URL
      window.history.pushState({}, '', currentUrl);
      return false;
    }
  }
  
  // Main function to fix inventory display
  async function fixInventoryDisplay() {
    // Try to find and use the inventory context
    const context = findInventoryContext();
    if (context) {
      console.log("Successfully found inventory context");
    } else {
      console.log("Could not find inventory context directly");
    }
    
    // Try clicking refresh button
    const clickedRefresh = clickRefreshButton();
    
    // If we couldn't click a refresh button, try simulating navigation
    if (!clickedRefresh) {
      console.log("No refresh button found, trying navigation simulation");
      simulateNavigation();
    }
    
    // Add a message to the console
    console.log("\nInventory refresh attempted!");
    console.log("If items still don't appear, try the following:");
    console.log("1. Reload the page completely");
    console.log("2. Check the browser console for errors");
    console.log("3. Verify that the database connection is working");
    console.log("4. Run the debug-excel-import.js script to check database state");
  }
  
  // Run the fix
  fixInventoryDisplay();
})();
