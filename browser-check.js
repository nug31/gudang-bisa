// This script can be pasted into the browser console to check what's being displayed
// Copy and paste this into the browser console

console.log("Checking inventory items in the browser...");

// Manually fetch inventory items from the server
async function fetchInventoryItems() {
  try {
    console.log(
      "Manually fetching inventory items from /db/inventory endpoint..."
    );
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
      console.error(`Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(
      `Successfully retrieved ${data.length} items from /db/inventory endpoint`
    );

    if (data.length > 0) {
      console.log("First 5 items:");
      data.slice(0, 5).forEach((item, index) => {
        console.log(`Item ${index + 1}: ${item.name} (ID: ${item.id})`);
      });
    }

    return data;
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return null;
  }
}

// Check React context
function checkReactContext() {
  console.log("\nChecking React context...");

  // Try to access the inventory context
  try {
    // Find all React root elements
    const rootElements = document.querySelectorAll("[data-reactroot]");
    console.log(`Found ${rootElements.length} React root elements`);

    // Try to find the inventory context in the React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log("React DevTools are installed");

      // Get all React instances
      const reactInstances = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers;
      if (reactInstances && reactInstances.size > 0) {
        console.log("Found React instances");

        // Try to find React Fiber root
        const fiberRoot = reactInstances
          .get(1)
          ?.findFiberByHostInstance(document.querySelector("#root"));
        if (fiberRoot) {
          console.log("Found React Fiber root");

          // Try to find the InventoryContext provider
          let inventoryProvider = null;

          // Function to search for the InventoryContext provider in the fiber tree
          function findInventoryProvider(fiber) {
            if (!fiber) return null;

            // Check if this fiber is the InventoryContext provider
            if (fiber.type && fiber.type.name === "InventoryProvider") {
              return fiber;
            }

            // Check child fibers
            if (fiber.child) {
              const result = findInventoryProvider(fiber.child);
              if (result) return result;
            }

            // Check sibling fibers
            if (fiber.sibling) {
              const result = findInventoryProvider(fiber.sibling);
              if (result) return result;
            }

            return null;
          }

          inventoryProvider = findInventoryProvider(fiberRoot);

          if (inventoryProvider) {
            console.log("Found InventoryProvider component");
            console.log(
              "InventoryProvider state:",
              inventoryProvider.memoizedState
            );
          } else {
            console.log("Could not find InventoryProvider component");
          }
        } else {
          console.log("Could not find React Fiber root");
        }
      } else {
        console.log("Could not find React instances");
      }
    } else {
      console.log("React DevTools are not installed");
    }
  } catch (error) {
    console.error("Error checking React context:", error);
  }
}

// Check DOM for inventory items
function checkDOM() {
  console.log("\nChecking DOM for inventory items...");

  // Look for table rows that might contain inventory items
  const tableRows = document.querySelectorAll("table tbody tr");
  if (tableRows.length > 0) {
    console.log(
      `Found ${tableRows.length} table rows that might contain inventory items`
    );
    console.log("First 5 rows:");
    Array.from(tableRows)
      .slice(0, 5)
      .forEach((row, index) => {
        console.log(
          `Row ${index + 1}:`,
          row.textContent.trim().substring(0, 100) + "..."
        );
      });
  } else {
    console.log("No table rows found that might contain inventory items");
  }

  // Look for any elements that might contain inventory items
  const inventoryElements = document.querySelectorAll(
    ".inventory-item, [data-inventory-item], .item-card, .item-row"
  );
  if (inventoryElements.length > 0) {
    console.log(
      `Found ${inventoryElements.length} inventory item elements in the DOM`
    );
    console.log("First 5 elements:");
    Array.from(inventoryElements)
      .slice(0, 5)
      .forEach((element, index) => {
        console.log(
          `Element ${index + 1}:`,
          element.textContent.trim().substring(0, 50) + "..."
        );
      });
  } else {
    console.log("No inventory item elements found in the DOM");

    // Try to find any elements that might contain inventory items
    const possibleContainers = document.querySelectorAll(
      ".inventory-container, .items-container, .item-list, .inventory-list, .dashboard-content, main, .content"
    );
    if (possibleContainers.length > 0) {
      console.log(
        `Found ${possibleContainers.length} possible container elements`
      );
      console.log("First 5 containers:");
      Array.from(possibleContainers)
        .slice(0, 5)
        .forEach((element, index) => {
          console.log(`Container ${index + 1}:`, element);
        });
    } else {
      console.log("No possible container elements found");
    }
  }
}

// Run all checks
async function runAllChecks() {
  // Fetch inventory items from the server
  const serverItems = await fetchInventoryItems();

  // Check React context
  checkReactContext();

  // Check DOM
  checkDOM();

  // Return the server items for further inspection
  return serverItems;
}

// Run all checks and store the result in a global variable
window.serverItems = await runAllChecks();
