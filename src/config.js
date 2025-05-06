// Environment variables for frontend
const config = {
  // Supabase configuration (for backward compatibility)
  supabaseUrl:
    import.meta.env?.VITE_SUPABASE_URL ||
    "https://hvrhtzjxdcahpceqkvbd.supabase.co",

  supabaseAnonKey:
    import.meta.env?.VITE_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cmh0emp4ZGNhaHBjZXFrdmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NTQ3NzcsImV4cCI6MjA2MjAzMDc3N30.3ihqV2D7BlJhBtL5BPwgf_8CzAN19w604mBwRGPihsQ",

  // Neon database configuration
  neonConnectionString:
    import.meta.env?.NEON_CONNECTION_STRING ||
    "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",

  // API URL
  apiUrl: import.meta.env?.VITE_API_URL || "http://localhost:3001",

  // JWT Secret
  jwtSecret:
    import.meta.env?.JWT_SECRET || "your-default-jwt-secret-for-development",
};

export default config;
