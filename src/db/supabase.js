import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file"
  );
  console.error("Current environment variables:", {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "[HIDDEN]"
      : undefined,
  });
}

const supabase = createClient(
  supabaseUrl || "https://jwrhtzjxdcahpceqkvbd.supabase.co",
  supabaseKey ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cmh0emp4ZGNhaHBjZXFrdmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NTQ3NzcsImV4cCI6MjA2MjAzMDc3N30.3ihqV2D7BlJhBtL5BPwgf_8CzAN19w604mBwRGPihsQ"
);

export default supabase;
