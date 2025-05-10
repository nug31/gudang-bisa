// Script to update Netlify environment variables
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
require("dotenv").config();

// Neon database connection string
const NEON_CONNECTION_STRING =
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

// Function to check if Netlify CLI is installed
function checkNetlifyCLI() {
  try {
    execSync("netlify --version", { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to update Netlify environment variables
function updateNetlifyEnv() {
  console.log("Updating Netlify environment variables...");

  try {
    // Set NEON_CONNECTION_STRING
    execSync(
      `netlify env:set NEON_CONNECTION_STRING "${NEON_CONNECTION_STRING}"`,
      { stdio: "inherit" }
    );
    console.log("Successfully set NEON_CONNECTION_STRING");

    // List all environment variables to verify
    console.log("\nListing all environment variables:");
    execSync("netlify env:list", { stdio: "inherit" });

    console.log("\nEnvironment variables updated successfully!");
    console.log(
      "Note: You may need to redeploy your site for the changes to take effect."
    );
  } catch (error) {
    console.error(
      "Error updating Netlify environment variables:",
      error.message
    );
    process.exit(1);
  }
}

// Main function
function main() {
  console.log("Netlify Environment Variables Update Script");
  console.log("==========================================");

  // Check if Netlify CLI is installed
  if (!checkNetlifyCLI()) {
    console.error(
      "Netlify CLI is not installed. Please install it using: npm install -g netlify-cli"
    );
    process.exit(1);
  }

  // Update Netlify environment variables
  updateNetlifyEnv();
}

// Run the main function
main();
