import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseKey ? "[HIDDEN]" : undefined);

// Initialize Supabase client
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...");

    // Test connection with a simple query
    const { data, error } = await supabase
      .from("users")
      .select("count(*)", { count: "exact" });

    if (error) {
      console.error("Error connecting to Supabase:", error);
      return;
    }

    console.log("Successfully connected to Supabase!");
    console.log("Data:", data);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

testSupabaseConnection();
