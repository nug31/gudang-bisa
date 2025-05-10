/**
 * Utility functions for working with Netlify
 */

/**
 * Check if the application is running in production (Netlify)
 * @returns True if running in production
 */
export const isProduction = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('netlify.app') ||
      window.location.hostname.includes('gudangmitra'))
  );
};

/**
 * Get the appropriate API endpoint based on the environment
 * @param endpoint The endpoint path (e.g., 'inventory', 'users')
 * @returns The full endpoint URL
 */
export const getApiEndpoint = (endpoint: string): string => {
  // Base paths for different environments
  const basePath = isProduction() ? '/.netlify/functions/neon-' : '/db/';
  
  // Return the full endpoint URL
  return `${basePath}${endpoint}`;
};

/**
 * Get the appropriate DB endpoint based on the environment
 * @param endpoint The endpoint path (e.g., 'inventory', 'users')
 * @returns The full endpoint URL
 */
export const getDbEndpoint = (endpoint: string): string => {
  // In production, use Netlify functions
  if (isProduction()) {
    return `/.netlify/functions/neon-${endpoint}`;
  }
  
  // In development, use the /db endpoint
  return `/db/${endpoint}`;
};

/**
 * Make an API call with error handling and retries
 * @param endpoint The endpoint to call
 * @param method The HTTP method
 * @param data The data to send
 * @param retries The number of retries
 * @returns The response data
 */
export const apiCall = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  data: any = {},
  retries: number = 1
): Promise<T> => {
  // Get the appropriate endpoint URL
  const url = getApiEndpoint(endpoint);
  
  console.log(`Making ${method} request to ${url}`);
  
  try {
    // Make the API call
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(data) : undefined,
    });
    
    // Check if the response is OK
    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }
    
    // Parse the response
    const responseData = await response.json();
    return responseData as T;
  } catch (error) {
    // If we have retries left, try again
    if (retries > 0) {
      console.log(`API call failed, retrying... (${retries} retries left)`);
      return apiCall(endpoint, method, data, retries - 1);
    }
    
    // Otherwise, throw the error
    throw error;
  }
};
