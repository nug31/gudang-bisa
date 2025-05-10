// Script to deploy the fixed version to Netlify
import { execSync } from "child_process";

console.log("Starting deployment of item request fix to Netlify...");

try {
  // Step 1: Build the application
  console.log("\n🔨 Step 1: Building the application...");
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Application built successfully.");

  // Step 2: Deploy to Netlify
  console.log("\n🚀 Step 2: Deploying to Netlify...");

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

  console.log("\n🎉 Fixed version deployed to Netlify successfully!");
  console.log(
    "\nYour application should now be able to create item requests properly."
  );
  console.log("\nThe fix includes:");
  console.log("1. Improved handling of request data in the Netlify function");
  console.log("2. Better error handling and logging");
  console.log("3. Support for all required fields in the database schema");
} catch (error) {
  console.error("❌ Deployment failed:", error.message);
  process.exit(1);
}
