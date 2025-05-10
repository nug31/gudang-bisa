import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables from .env and .env.local
config();

// Check if .env.local exists and load it
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  // Use the already imported config function instead of require
  const envContent = fs.readFileSync(envLocalPath, "utf8");
  const envLines = envContent.split("\n");

  for (const line of envLines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";

      // Remove quotes if present
      if (
        value.length > 0 &&
        value.charAt(0) === '"' &&
        value.charAt(value.length - 1) === '"'
      ) {
        value = value.replace(/^"|"$/g, "");
      }

      process.env[key] = value;
    }
  }
}

// Supabase configuration
// Use environment variables with fallbacks
const supabaseUrl =
  process.env.SUPABASE_URL || "https://hvrhtzjxdcahpceqkvbd.supabase.co";
// Use the anon key with RLS policies
const supabaseKey =
  process.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cmh0emp4ZGNhaHBjZXFrdmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NTQ3NzcsImV4cCI6MjA2MjAzMDc3N30.3ihqV2D7BlJhBtL5BPwgf_8CzAN19w604mBwRGPihsQ";
// Service role key to bypass RLS policies
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cmh0emp4ZGNhaHBjZXFrdmJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjQ1NDc3NywiZXhwIjoyMDYyMDMwNzc3fQ.3ihqV2D7BlJhBtL5BPwgf_8CzAN19w604mBwRGPihsQ";

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key exists:", !!supabaseKey);
console.log("Supabase Service Role Key exists:", !!supabaseServiceRoleKey);

// Create a mock Supabase client that will be used when the real one fails
const mockSupabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        limit: async () => ({ data: [], error: null }),
        order: async () => ({ data: [], error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
      }),
      neq: () => ({
        maybeSingle: async () => ({ data: null, error: null }),
      }),
      in: () => ({
        limit: async () => ({ data: [], error: null }),
      }),
      limit: async () => ({ data: [], error: null }),
      order: async () => ({ data: [], error: null }),
    }),
    insert: () => ({
      select: async () => ({ data: [{}], error: null }),
      single: async () => ({ data: {}, error: null }),
    }),
    update: () => ({
      eq: () => ({
        select: async () => ({ data: [{}], error: null }),
        single: async () => ({ data: {}, error: null }),
      }),
    }),
    delete: () => ({
      eq: async () => ({ error: null }),
    }),
  }),
  rpc: async () => ({ error: null }),
};

// Create a Supabase client with admin privileges using the service role key
const createAdminClient = () => {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.warn(
        "Missing Supabase URL or service role key. Using regular client."
      );
      return supabase;
    }

    // Create the Supabase client with the service role key
    const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "x-my-custom-header": "gudang-mitra-server-admin",
        },
      },
    });

    console.log("Admin Supabase client created successfully");
    return client;
  } catch (error) {
    console.error("Error creating admin Supabase client:", error);
    console.warn("Falling back to regular client");
    return supabase;
  }
};

// Create the default Supabase client with the anonymous key
let supabase;

try {
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase environment variables. Using mock data.");
    supabase = mockSupabase;
  } else {
    // Try to create the real Supabase client with additional options
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "x-my-custom-header": "gudang-mitra-server",
        },
      },
    });
    console.log("Supabase client created successfully");
  }
} catch (error) {
  console.error("Error creating Supabase client:", error);
  console.warn("Falling back to mock data");
  supabase = mockSupabase;
}

export { createAdminClient };
export default supabase;
