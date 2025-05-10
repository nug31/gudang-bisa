import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on mode
  const env = loadEnv(mode, process.cwd(), "");
  const isProduction = mode === "production";

  return {
    plugins: [
      react({
        // Add this to ensure React is properly imported
        jsxRuntime: "automatic",
        jsxImportSource: "react",
        babel: {
          plugins: [
            ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
          ],
        },
      }),
    ],
    optimizeDeps: {
      include: ["react", "react-dom"],
      exclude: ["lucide-react"],
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: !isProduction,
      minify: isProduction,
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          debug: resolve(__dirname, "public/debug.html"),
          testApi: resolve(__dirname, "public/test-api.html"),
        },
      },
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
