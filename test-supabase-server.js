import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? '[HIDDEN]' : undefined);

const supabase = createClient(
  supabaseUrl || 'https://jwrhtzjxdcahpceqkvbd.supabase.co',
  supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2cmh0emp4ZGNhaHBjZXFrdmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NTQ3NzcsImV4cCI6MjA2MjAzMDc3N30.3ihqV2D7BlJhBtL5BPwgf_8CzAN19w604mBwRGPihsQ'
);

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
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact' });
    
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
