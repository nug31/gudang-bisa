// Debug script for Netlify deployment issues
// Run this in the browser console when you see a blank page

(function() {
  console.log("=== Netlify Deployment Debug ===");
  
  // Check if React is loaded
  if (window.React) {
    console.log("✅ React is loaded:", window.React.version);
  } else {
    console.error("❌ React is not loaded");
  }
  
  // Check if React DOM is loaded
  if (window.ReactDOM) {
    console.log("✅ ReactDOM is loaded");
  } else {
    console.error("❌ ReactDOM is not loaded");
  }
  
  // Check for root element
  const rootElement = document.getElementById('root');
  if (rootElement) {
    console.log("✅ Root element found:", rootElement);
    console.log("Root element content:", rootElement.innerHTML);
  } else {
    console.error("❌ Root element not found");
  }
  
  // Check for JavaScript errors
  if (window.onerror) {
    console.log("✅ Error handler is set up");
  } else {
    console.warn("⚠️ No global error handler");
  }
  
  // Check for environment variables
  console.log("Environment:", process?.env?.NODE_ENV || "Not available");
  
  // Check for API endpoints
  const apiEndpoints = [
    "/.netlify/functions/neon-inventory",
    "/.netlify/functions/neon-auth",
    "/.netlify/functions/neon-categories",
    "/db/inventory",
    "/api/inventory"
  ];
  
  console.log("Testing API endpoints...");
  apiEndpoints.forEach(endpoint => {
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "getAll" })
    })
    .then(response => {
      console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
      return response.json();
    })
    .then(data => {
      console.log(`Data from ${endpoint}:`, data);
    })
    .catch(error => {
      console.error(`❌ ${endpoint}: ${error.message}`);
    });
  });
  
  // Check for routing issues
  if (window.location.pathname !== "/") {
    console.warn("⚠️ Not on root path, might be a routing issue:", window.location.pathname);
  }
  
  // Check for CSS loading
  const styleSheets = document.styleSheets;
  console.log(`${styleSheets.length} stylesheets loaded`);
  
  // Check for script loading
  const scripts = document.scripts;
  console.log(`${scripts.length} scripts loaded`);
  Array.from(scripts).forEach((script, index) => {
    console.log(`Script ${index + 1}: ${script.src || 'inline'}`);
  });
  
  // Check for network issues
  if (navigator.onLine) {
    console.log("✅ Browser is online");
  } else {
    console.error("❌ Browser is offline");
  }
  
  // Check for localStorage
  try {
    localStorage.setItem('netlify_debug_test', 'test');
    localStorage.removeItem('netlify_debug_test');
    console.log("✅ localStorage is working");
  } catch (e) {
    console.error("❌ localStorage error:", e);
  }
  
  // Check for service workers
  if (navigator.serviceWorker) {
    console.log("Service Worker API is available");
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log(`${registrations.length} service workers registered`);
    });
  }
  
  // Recommendations
  console.log("\n=== Recommendations ===");
  console.log("1. Check the browser console for errors");
  console.log("2. Verify that the Netlify redirects are set up correctly");
  console.log("3. Check that environment variables are set correctly");
  console.log("4. Try clearing browser cache and hard refreshing (Ctrl+Shift+R)");
  console.log("5. Check Netlify function logs for backend errors");
})();
