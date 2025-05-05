import { promises as fs } from "fs";
import { join } from "path";
import { reinitDatabase } from "../src/db";

async function toggleDbMode() {
  try {
    // Read current .env file
    const envPath = join(__dirname, "../.env");
    const envContent = await fs.readFile(envPath, "utf8");
    
    // Parse current USE_MOCK_DB value
    const mockDbMatch = envContent.match(/^USE_MOCK_DB=(true|false)$/m);
    const currentMode = mockDbMatch ? mockDbMatch[1] : "false";
    
    // Toggle the value
    const newMode = currentMode === "true" ? "false" : "true";
    
    // Update .env content
    const newEnvContent = envContent.replace(
      /^USE_MOCK_DB=(true|false)$/m,
      `USE_MOCK_DB=${newMode}`
    );
    
    // Write updated .env
    await fs.writeFile(envPath, newEnvContent, "utf8");
    
    console.log(`\nSwitching database mode...`);
    console.log(`Previous mode: ${currentMode === "true" ? "mock" : "real"}`);
    console.log(`New mode: ${newMode === "true" ? "mock" : "real"}`);
    
    // Reinitialize database connection
    await reinitDatabase();
    
    console.log("\n✅ Database mode successfully toggled!");
  } catch (error) {
    console.error("❌ Error toggling database mode:", error);
  }
}

toggleDbMode();
