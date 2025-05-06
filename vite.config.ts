import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on mode
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3002",
          changeOrigin: true,
          secure: false,
        },
        "/db": {
          target: "http://localhost:3002",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      // Make environment variables available to the client
      "process.env": {
        NODE_ENV: JSON.stringify(mode),
        VITE_API_URL: JSON.stringify(
          env.VITE_API_URL || "http://localhost:3001"
        ),
        NEON_CONNECTION_STRING: JSON.stringify(
          env.NEON_CONNECTION_STRING ||
            "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
        ),
        JWT_SECRET: JSON.stringify(
          env.JWT_SECRET || "your-default-jwt-secret-for-development"
        ),
      },
      // For backward compatibility, also define these
      "import.meta.env.VITE_API_URL": JSON.stringify(
        env.VITE_API_URL || "http://localhost:3001"
      ),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_URL ||
          "https://jwrhtzjxdcahpceqkvbd.supabase.co"
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cmh0emp4ZGNhaHBjZXFrdmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NTQ3NzcsImV4cCI6MjA2MjAzMDc3N30.3ihqV2D7BlJhBtL5BPwgf_8CzAN19w604mBwRGPihsQ"
      ),
    },
  };
});
