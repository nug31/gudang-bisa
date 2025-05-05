import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import readline from "readline";

const execAsync = promisify(exec);

// Configuration - Update these values with your CloudPanel information
const SSH_HOST = "145.79.11.48";
const SSH_USER = "gudangmitra";
const SITE_DIRECTORY = "/home/gudangmitra/htdocs/gudangmitra.nugjourney.com";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function deployViaSSH() {
  try {
    console.log("Starting deployment to CloudPanel via SSH...");

    // Step 1: Build the application
    console.log("\n📦 Building the application...");
    await execAsync("npm run build");
    console.log("✅ Build completed successfully.");

    // Step 2: Check if the deploy directory exists
    const deployDir = path.join(process.cwd(), "deploy");
    try {
      await fs.access(deployDir);
    } catch (error) {
      console.log(
        "❌ Deploy directory not found. Creating deployment package..."
      );
      await execAsync("node scripts/deploy-to-cloudpanel.js");
      console.log("✅ Deployment package created successfully.");
    }

    // Step 3: Ask for SSH password
    console.log("\n🔑 SSH Authentication");
    const password = await prompt(
      "Enter your SSH password (or press Enter to use SSH key): "
    );

    // Step 4: Create the remote directory if it doesn't exist
    console.log("\n📁 Creating remote directory...");
    const sshOptions = password ? `-p "${password}"` : "";

    try {
      await execAsync(
        `ssh ${SSH_USER}@${SSH_HOST} "mkdir -p ${SITE_DIRECTORY}"`
      );
      console.log(`✅ Remote directory created: ${SITE_DIRECTORY}`);
    } catch (error) {
      console.error("❌ Error creating remote directory:", error.message);
      console.log("⚠️ Continuing with deployment...");
    }

    // Step 5: Upload files using rsync or scp
    console.log("\n📤 Uploading files to CloudPanel...");
    console.log(
      "This may take a few minutes depending on your connection speed..."
    );

    try {
      // Try using rsync first (more efficient)
      const rsyncCommand = password
        ? `sshpass -p "${password}" rsync -avz --progress ./deploy/ ${SSH_USER}@${SSH_HOST}:${SITE_DIRECTORY}/`
        : `rsync -avz --progress ./deploy/ ${SSH_USER}@${SSH_HOST}:${SITE_DIRECTORY}/`;

      await execAsync(rsyncCommand);
      console.log("✅ Files uploaded successfully using rsync.");
    } catch (error) {
      console.log("⚠️ Rsync failed, trying scp instead...");

      try {
        const scpCommand = password
          ? `sshpass -p "${password}" scp -r ./deploy/* ${SSH_USER}@${SSH_HOST}:${SITE_DIRECTORY}/`
          : `scp -r ./deploy/* ${SSH_USER}@${SSH_HOST}:${SITE_DIRECTORY}/`;

        await execAsync(scpCommand);
        console.log("✅ Files uploaded successfully using scp.");
      } catch (scpError) {
        console.error("❌ Error uploading files:", scpError.message);
        console.log("Please check your SSH credentials and try again.");
        rl.close();
        return;
      }
    }

    // Step 6: Install dependencies on the remote server
    console.log("\n📦 Installing dependencies on the remote server...");

    try {
      await execAsync(
        `ssh ${SSH_USER}@${SSH_HOST} "cd ${SITE_DIRECTORY} && npm install --production"`
      );
      console.log("✅ Dependencies installed successfully.");
    } catch (error) {
      console.error("❌ Error installing dependencies:", error.message);
      console.log(
        "⚠️ You may need to install dependencies manually on the server."
      );
    }

    // Step 7: Test the database connection
    console.log("\n🔍 Testing database connection on the remote server...");

    try {
      await execAsync(
        `ssh ${SSH_USER}@${SSH_HOST} "cd ${SITE_DIRECTORY} && node server-test.js"`
      );
      console.log("✅ Database connection test completed.");
    } catch (error) {
      console.error("❌ Error testing database connection:", error.message);
      console.log("⚠️ You may need to check your database configuration.");
    }

    // Step 8: Start the application
    console.log("\n🚀 Starting the application...");

    try {
      await execAsync(
        `ssh ${SSH_USER}@${SSH_HOST} "cd ${SITE_DIRECTORY} && pm2 start server.js --name gudang-mitra || node server.js &"`
      );
      console.log("✅ Application started successfully.");
    } catch (error) {
      console.error("❌ Error starting the application:", error.message);
      console.log(
        "⚠️ You may need to start the application manually on the server."
      );
    }

    console.log("\n🎉 Deployment completed successfully!");
    console.log(
      `Your application should now be running at: http://gudangmitra.nugjourney.com`
    );
    console.log("\nIf you encounter any issues:");
    console.log("1. Check the application logs on the server");
    console.log("2. Verify that the database connection is working");
    console.log("3. Make sure the Node.js application is running");
    console.log("4. Check the Nginx configuration in CloudPanel");

    rl.close();
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    rl.close();
  }
}

// Run the deployment script
deployViaSSH().catch((error) => {
  console.error("❌ Deployment script failed:", error);
  rl.close();
});
