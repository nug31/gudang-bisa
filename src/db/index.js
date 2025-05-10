// This file handles the browser vs. server environment differences
// for database access

// Import the browser-safe version
import neonBrowser from './neon-browser';

// Export the browser version by default
export default neonBrowser;

// Also export the auth functions
export const neonAuth = neonBrowser.neonAuth;
