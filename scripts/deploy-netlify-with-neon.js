import { execSync } from "child_process";
import { config } from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deployToNetlifyWithNeon() {
  try {
    console.log("Starting deployment to Netlify with Neon PostgreSQL...");

    // Step 1: Build the application
    console.log("\n🔨 Step 1: Building the application...");
    try {
      execSync("npm run build", { stdio: "inherit" });
      console.log("✅ Application built successfully.");
    } catch (error) {
      console.error("❌ Application build failed.");
      process.exit(1);
    }

    // Step 2: Check if Netlify CLI is installed
    console.log("\n🔍 Step 2: Checking if Netlify CLI is installed...");
    try {
      execSync("netlify --version", { stdio: "inherit" });
      console.log("✅ Netlify CLI is installed.");
    } catch (error) {
      console.log("⚠️ Netlify CLI is not installed. Installing...");
      try {
        execSync("npm install -g netlify-cli", { stdio: "inherit" });
        console.log("✅ Netlify CLI installed successfully.");
      } catch (error) {
        console.error("❌ Failed to install Netlify CLI.");
        console.log(
          "Please install Netlify CLI manually with: npm install -g netlify-cli"
        );
        process.exit(1);
      }
    }

    // Step 3: Ensure Netlify functions directory is set up correctly
    console.log("\n📁 Step 3: Setting up Netlify functions...");
    try {
      // Ensure the functions directory exists
      await fs.mkdir(path.join(process.cwd(), "netlify", "functions"), {
        recursive: true,
      });

      // Copy the new package.json file
      await fs.rename(
        path.join(process.cwd(), "netlify", "functions", "package.json.new"),
        path.join(process.cwd(), "netlify", "functions", "package.json")
      );

      console.log("✅ Netlify functions set up successfully.");
    } catch (error) {
      console.error("⚠️ Error setting up Netlify functions:", error);
      // Continue anyway as the error might be because the file already exists
    }

    // Step 4: Set environment variables in Netlify
    console.log("\n🔑 Step 4: Setting environment variables in Netlify...");
    try {
      execSync("node scripts/set-netlify-env-vars.js", { stdio: "inherit" });
      console.log("✅ Environment variables set successfully!");
    } catch (error) {
      console.error(
        "⚠️ Failed to set environment variables. You may need to set them manually."
      );
      console.log("Continuing with deployment...");
    }

    // Step 5: Deploy to Netlify
    console.log("\n🚀 Step 5: Deploying to Netlify...");
    try {
      // Check if user is logged in
      try {
        execSync("netlify status", { stdio: "inherit" });
      } catch (error) {
        console.log("⚠️ Not logged in to Netlify. Please log in:");
        execSync("netlify login", { stdio: "inherit" });
      }

      // Deploy to Netlify
      console.log("\nDeploying to Netlify...");
      execSync("netlify deploy --prod", { stdio: "inherit" });
      console.log("✅ Deployment successful!");
    } catch (error) {
      console.error("❌ Deployment failed.");
      process.exit(1);
    }

    console.log(
      "\n🎉 Deployment to Netlify with Neon PostgreSQL completed successfully!"
    );
    console.log(
      "\nYour application is now deployed with the Neon PostgreSQL database connection configured automatically."
    );
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

// Run the deployment
deployToNetlifyWithNeon().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
