// This script can be pasted into the browser console to check network requests
// Copy and paste this into the browser console

console.log('Checking network requests...');

// Create a fetch interceptor
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const [resource, config] = args;
  
  // Log the request
  console.log(`Fetch request: ${resource}`);
  if (config && config.body) {
    try {
      const body = JSON.parse(config.body);
      console.log('Request body:', body);
    } catch (error) {
      console.log('Request body (not JSON):', config.body);
    }
  }
  
  // Call the original fetch function
  try {
    const response = await originalFetch.apply(this, args);
    
    // Clone the response to read it twice
    const clone = response.clone();
    
    // Try to parse the response as JSON
    try {
      const text = await clone.text();
      if (text) {
        const data = JSON.parse(text);
        console.log(`Response for ${resource}:`, data);
        
        // If this is an inventory request, log more details
        if (resource.includes('/inventory') || resource.includes('/db/inventory')) {
          console.log(`Retrieved ${Array.isArray(data) ? data.length : 'non-array'} items from ${resource}`);
          if (Array.isArray(data) && data.length > 0) {
            console.log('First 5 items:');
            data.slice(0, 5).forEach((item, index) => {
              console.log(`Item ${index + 1}: ${item.name} (ID: ${item.id})`);
            });
          }
        }
      }
    } catch (error) {
      console.log(`Response for ${resource} is not JSON`);
    }
    
    return response;
  } catch (error) {
    console.error(`Error in fetch for ${resource}:`, error);
    throw error;
  }
};

console.log('Fetch interceptor installed. All fetch requests will be logged.');
console.log('Try navigating to different pages or refreshing to see the requests.');

// Also intercept XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  this._url = url;
  this._method = method;
  return originalXHROpen.apply(this, [method, url, ...rest]);
};

XMLHttpRequest.prototype.send = function(body) {
  console.log(`XHR ${this._method} request: ${this._url}`);
  if (body) {
    try {
      const parsedBody = JSON.parse(body);
      console.log('XHR request body:', parsedBody);
    } catch (error) {
      console.log('XHR request body (not JSON):', body);
    }
  }
  
  // Add response listener
  this.addEventListener('load', function() {
    console.log(`XHR response for ${this._url} received`);
    try {
      const data = JSON.parse(this.responseText);
      console.log(`XHR response for ${this._url}:`, data);
      
      // If this is an inventory request, log more details
      if (this._url.includes('/inventory') || this._url.includes('/db/inventory')) {
        console.log(`Retrieved ${Array.isArray(data) ? data.length : 'non-array'} items from ${this._url}`);
        if (Array.isArray(data) && data.length > 0) {
          console.log('First 5 items:');
          data.slice(0, 5).forEach((item, index) => {
            console.log(`Item ${index + 1}: ${item.name} (ID: ${item.id})`);
          });
        }
      }
    } catch (error) {
      console.log(`XHR response for ${this._url} is not JSON`);
    }
  });
  
  return originalXHRSend.apply(this, [body]);
};

console.log('XMLHttpRequest interceptor installed. All XHR requests will be logged.');
console.log('Try navigating to different pages or refreshing to see the requests.');
