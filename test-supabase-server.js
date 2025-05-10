import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config();

// Initialize Supabase client
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseKey ? "[HIDDEN]" : undefined);

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/api/test", async (req, res) => {
  try {
    res.json({ message: "Server is running" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Supabase test route
app.get("/api/supabase-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("count(*)", { count: "exact" });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Supabase connection error" });
    }

    res.json({ message: "Supabase connection successful", data });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using Supabase at ${supabaseUrl}`);
});
