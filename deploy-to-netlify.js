// Script to deploy the application to Netlify with Neon database
import { execSync } from "child_process";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deployToNetlify() {
  try {
    console.log("🚀 Deploying to Netlify with Neon database...");

    // Step 1: Check if Netlify CLI is installed
    console.log("\n📋 Step 1: Checking Netlify CLI installation...");
    try {
      execSync("netlify --version", { stdio: "pipe" });
      console.log("✅ Netlify CLI is installed");
    } catch (error) {
      console.log("⚠️ Netlify CLI is not installed. Installing...");
      try {
        execSync("npm install -g netlify-cli", { stdio: "inherit" });
        console.log("✅ Netlify CLI installed successfully");
      } catch (installError) {
        console.error("❌ Failed to install Netlify CLI");
        console.log("Please install Netlify CLI manually: npm install -g netlify-cli");
        process.exit(1);
      }
    }

    // Step 2: Check if user is logged in to Netlify
    console.log("\n📋 Step 2: Checking Netlify login status...");
    try {
      execSync("netlify status", { stdio: "pipe" });
      console.log("✅ Logged in to Netlify");
    } catch (error) {
      console.log("⚠️ Not logged in to Netlify. Please log in:");
      execSync("netlify login", { stdio: "inherit" });
    }

    // Step 3: Check if site is linked
    console.log("\n📋 Step 3: Checking if site is linked...");
    try {
      const siteData = execSync("netlify status", { encoding: "utf8" });
      if (siteData.includes("Site not linked")) {
        console.log("⚠️ Site not linked. Linking site...");
        execSync("netlify link", { stdio: "inherit" });
      } else {
        console.log("✅ Site is linked to Netlify");
      }
    } catch (error) {
      console.error("❌ Failed to check site link status:", error.message);
      process.exit(1);
    }

    // Step 4: Set environment variables
    console.log("\n📋 Step 4: Setting environment variables...");
    
    // Get Neon connection string
    const neonConnectionString = process.env.NEON_CONNECTION_STRING;
    if (!neonConnectionString) {
      console.error("❌ NEON_CONNECTION_STRING not found in environment variables");
      process.exit(1);
    }
    
    try {
      // Set NEON_CONNECTION_STRING
      execSync(`netlify env:set NEON_CONNECTION_STRING "${neonConnectionString}" --force`, { stdio: "inherit" });
      console.log("✅ NEON_CONNECTION_STRING set successfully");
      
      // Set NODE_ENV
      execSync(`netlify env:set NODE_ENV "production" --force`, { stdio: "inherit" });
      console.log("✅ NODE_ENV set to production");
      
      // Set USE_MOCK_DB
      execSync(`netlify env:set USE_MOCK_DB "false" --force`, { stdio: "inherit" });
      console.log("✅ USE_MOCK_DB set to false");
    } catch (error) {
      console.error("❌ Failed to set environment variables:", error.message);
      console.log("Please set the environment variables manually in the Netlify dashboard");
    }

    // Step 5: Build the application
    console.log("\n📋 Step 5: Building the application...");
    try {
      execSync("npm run build", { stdio: "inherit" });
      console.log("✅ Application built successfully");
    } catch (error) {
      console.error("❌ Failed to build the application:", error.message);
      process.exit(1);
    }

    // Step 6: Deploy to Netlify
    console.log("\n📋 Step 6: Deploying to Netlify...");
    try {
      execSync("netlify deploy --prod", { stdio: "inherit" });
      console.log("✅ Deployment successful!");
    } catch (error) {
      console.error("❌ Failed to deploy to Netlify:", error.message);
      process.exit(1);
    }

    console.log("\n🎉 Deployment completed successfully!");
    console.log("Your application is now deployed to Netlify with Neon database.");
    console.log("You can access your site at: https://gudangbisa.netlify.app");
    
  } catch (error) {
    console.error("Error deploying to Netlify:", error);
    process.exit(1);
  }
}

// Run the function
deployToNetlify().catch(error => {
  console.error("Failed to deploy to Netlify:", error);
  process.exit(1);
});
