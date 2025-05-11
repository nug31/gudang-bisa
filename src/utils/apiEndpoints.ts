/**
 * Utility functions for determining API endpoints based on the environment
 */

/**
 * Determines if the application is running on Vercel
 * @returns boolean indicating if running on Vercel
 */
export const isRunningOnVercel = (): boolean => {
  return window.location.hostname.includes('vercel.app');
};

/**
 * Determines if the application is running on Netlify
 * @returns boolean indicating if running on Netlify
 */
export const isRunningOnNetlify = (): boolean => {
  return window.location.hostname.includes('netlify.app');
};

/**
 * Determines if the application is running in production
 * @returns boolean indicating if running in production
 */
export const isProduction = (): boolean => {
  return (
    isRunningOnVercel() ||
    isRunningOnNetlify() ||
    window.location.hostname.includes('gudangmitra')
  );
};

/**
 * Gets the appropriate API endpoint based on the environment
 * @param endpoint The endpoint name (e.g., 'requests', 'inventory')
 * @returns The full API endpoint URL
 */
export const getApiEndpoint = (endpoint: string): string => {
  // If running on Vercel, use Vercel API routes
  if (isRunningOnVercel()) {
    return `/api/${endpoint}`;
  }
  
  // If running on Netlify, use Netlify functions
  if (isRunningOnNetlify()) {
    return `/.netlify/functions/neon-${endpoint}`;
  }
  
  // If running locally, try the local server first
  return `/db/${endpoint}`;
};

/**
 * Gets the appropriate API endpoint for direct database access
 * @param endpoint The endpoint name (e.g., 'requests', 'inventory')
 * @returns The full API endpoint URL for direct database access
 */
export const getDirectDbEndpoint = (endpoint: string): string => {
  // If running on Vercel, use Vercel API routes
  if (isRunningOnVercel()) {
    return `/api/${endpoint}`;
  }
  
  // If running on Netlify or in production, use Netlify functions
  if (isProduction()) {
    return `/.netlify/functions/neon-${endpoint}`;
  }
  
  // If running locally, use the local server
  return `/db/${endpoint}`;
};
