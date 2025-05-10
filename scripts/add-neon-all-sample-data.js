// Script to add all sample data to the Neon database
import "dotenv/config";
import { execSync } from "child_process";

console.log("Adding all sample data to Neon database...");

try {
  // Step 1: Add sample categories
  console.log("\n=== Adding sample categories ===");
  execSync("node scripts/add-neon-sample-categories.js", { stdio: "inherit" });

  // Step 2: Add sample inventory items
  console.log("\n=== Adding sample inventory items ===");
  execSync("node scripts/add-neon-sample-inventory.js", { stdio: "inherit" });

  // Step 3: Add sample requests (if available)
  try {
    console.log("\n=== Adding sample requests ===");
    execSync("node scripts/add-neon-sample-requests.js", { stdio: "inherit" });
  } catch (error) {
    console.log("Sample requests script not available or failed. Skipping...");
  }

  console.log("\n=== All sample data added successfully! ===");
} catch (error) {
  console.error("Error adding sample data:", error.message);
  process.exit(1);
}
