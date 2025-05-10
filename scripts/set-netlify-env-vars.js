import { execSync } from "child_process";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setNetlifyEnvVars() {
  try {
    console.log("Setting Netlify environment variables...");

    // Check if Netlify CLI is installed
    try {
      execSync("netlify --version", { stdio: "pipe" });
    } catch (error) {
      console.log("⚠️ Netlify CLI is not installed. Installing...");
      try {
        execSync("npm install -g netlify-cli", { stdio: "inherit" });
      } catch (installError) {
        console.error("❌ Failed to install Netlify CLI.");
        console.log(
          "Please install Netlify CLI manually with: npm install -g netlify-cli"
        );
        process.exit(1);
      }
    }

    // Check if user is logged in to Netlify
    try {
      execSync("netlify status", { stdio: "pipe" });
    } catch (error) {
      console.log("⚠️ Not logged in to Netlify. Please log in:");
      execSync("netlify login", { stdio: "inherit" });
    }

    // Get site info
    try {
      const siteData = execSync("netlify status", { encoding: "utf8" });
      console.log("✅ Site is linked to Netlify");
    } catch (error) {
      console.error("❌ Failed to get Netlify site status.");
      console.log("Please link your site first with: netlify link");
      process.exit(1);
    }

    // Get environment variables from .env file
    const neonConnectionString = process.env.NEON_CONNECTION_STRING;

    if (!neonConnectionString) {
      console.error("❌ NEON_CONNECTION_STRING not found in .env file.");
      console.log("Please add NEON_CONNECTION_STRING to your .env file.");
      process.exit(1);
    }

    // Set environment variables in Netlify
    console.log("Setting NEON_CONNECTION_STRING in Netlify...");

    try {
      // Use netlify env:set command to set the environment variable with force flag
      execSync(
        `netlify env:set NEON_CONNECTION_STRING "${neonConnectionString}" --force`,
        { stdio: "inherit" }
      );

      // Also set NODE_ENV to production with force flag
      execSync(`netlify env:set NODE_ENV "production" --force`, {
        stdio: "inherit",
      });

      // Set USE_MOCK_DB to false with force flag
      execSync(`netlify env:set USE_MOCK_DB "false" --force`, {
        stdio: "inherit",
      });

      console.log("✅ Successfully set environment variables in Netlify.");
    } catch (error) {
      console.error(
        "❌ Failed to set environment variables in Netlify:",
        error
      );
      process.exit(1);
    }

    console.log("\n🎉 Environment variables set successfully in Netlify!");
    console.log(
      "\nImportant: You need to redeploy your site for the environment variables to take effect."
    );
    console.log("You can redeploy with: netlify deploy --prod");
  } catch (error) {
    console.error("Error setting Netlify environment variables:", error);
    process.exit(1);
  }
}

// Run the function
setNetlifyEnvVars().catch((error) => {
  console.error("Failed to set Netlify environment variables:", error);
  process.exit(1);
});
