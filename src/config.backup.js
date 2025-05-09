// Environment variables for frontend
const config = {
  // Disable Supabase by setting empty URLs
  supabaseUrl: "",
  supabaseAnonKey: "",

  // API URL for Neon PostgreSQL
  apiUrl: import.meta.env?.VITE_API_URL || "/.netlify/functions",

  // Netlify function URLs for Neon PostgreSQL
  neonApiUrl: import.meta.env?.VITE_NEON_API_URL || "/.netlify/functions",

  // Use Neon PostgreSQL instead of Supabase
  useNeon: true,
};

export default config;
