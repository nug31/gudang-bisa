// Client-side environment configuration
// This file provides environment variables for the client-side code
// without relying on Node.js process.env

const env = {
  // API endpoints
  API_URL: import.meta.env.VITE_API_URL || '',
  
  // Default values for development
  isDevelopment: import.meta.env.DEV || false,
  isProduction: import.meta.env.PROD || false,
  
  // Application settings
  appName: 'Gudang Mitra',
  
  // API paths
  apiPaths: {
    inventory: '/db/inventory',
    categories: '/db/categories',
    requests: '/db/requests',
    users: '/db/users',
    auth: '/db/auth'
  }
};

export default env;
