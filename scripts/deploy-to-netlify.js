import { execSync } from "child_process";
import { config } from "dotenv";

// Load environment variables
config();

async function deployToNetlify() {
  try {
    console.log("Starting deployment to Netlify...");

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

    // Step 3: Deploy to Netlify
    console.log("\n🚀 Step 3: Deploying to Netlify...");
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

    console.log("\n🎉 Deployment to Netlify completed successfully!");
    console.log(
      "\nImportant: Make sure to set the following environment variables in your Netlify site settings:"
    );
    console.log("- NEON_CONNECTION_STRING");
    console.log("- NODE_ENV=production");
    console.log("- USE_MOCK_DB=false");
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

// Run the deployment
deployToNetlify().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
