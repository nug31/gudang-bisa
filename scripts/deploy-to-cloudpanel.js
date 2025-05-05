import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

// Configuration - Update these values with your CloudPanel information
const CLOUDPANEL_USERNAME = "your_cloudpanel_username"; // Replace with your CloudPanel username
const CLOUDPANEL_DOMAIN = "your_domain.com"; // Replace with your domain
const DEPLOY_PATH = "htdocs"; // CloudPanel typically uses htdocs instead of public_html

async function deployToCloudPanel() {
  try {
    console.log("Starting deployment to CloudPanel...");

    // Step 1: Build the application
    console.log("Building the application...");
    await execAsync("npm run build");
    console.log("Build completed successfully.");

    // Step 2: Create a deployment directory
    const deployDir = path.join(process.cwd(), "deploy");
    await fs.mkdir(deployDir, { recursive: true });
    console.log(`Created deployment directory at ${deployDir}`);

    // Step 3: Copy the built files to the deployment directory
    console.log("Copying built files...");
    await fs.cp(
      path.join(process.cwd(), "dist"),
      path.join(deployDir, "dist"),
      { recursive: true }
    );

    // Step 4: Copy server files
    console.log("Copying server files...");
    await fs.copyFile(
      path.join(process.cwd(), "server.js"),
      path.join(deployDir, "server.js")
    );

    // Step 5: Copy package.json and create a production package.json
    const packageJson = JSON.parse(
      await fs.readFile(path.join(process.cwd(), "package.json"), "utf8")
    );

    // Simplify package.json for production
    const prodPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      type: packageJson.type,
      scripts: {
        start: "node server.js",
      },
      dependencies: {
        "@supabase/supabase-js":
          packageJson.dependencies["@supabase/supabase-js"],
        bcryptjs: packageJson.dependencies["bcryptjs"],
        "body-parser": packageJson.dependencies["body-parser"],
        cors: packageJson.dependencies["cors"],
        dotenv: packageJson.dependencies["dotenv"],
        express: packageJson.dependencies["express"],
        mysql2: packageJson.dependencies["mysql2"],
        uuid: packageJson.dependencies["uuid"],
      },
    };

    await fs.writeFile(
      path.join(deployDir, "package.json"),
      JSON.stringify(prodPackageJson, null, 2)
    );

    // Step 6: Create .env file for production
    const envContent = `DB_HOST=127.0.0.1
DB_USER=gudang-mitra
DB_PASSWORD=J2T3plKAwGJceh4A4ttZ
DB_NAME=gudang-mitra
DB_PORT=3306
USE_MOCK_DB=false
PORT=8080`;

    await fs.writeFile(path.join(deployDir, ".env"), envContent);

    // Step 7: Create a .htaccess file for Apache/Nginx
    const htaccessContent = `# Enable RewriteEngine
RewriteEngine On

# Handle API requests
RewriteRule ^api/(.*)$ http://localhost:8080/api/$1 [P,L]
RewriteRule ^db/(.*)$ http://localhost:8080/db/$1 [P,L]

# Serve static files from the dist directory
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /dist/$1 [L]

# Set default document
DirectoryIndex index.html`;

    await fs.writeFile(path.join(deployDir, ".htaccess"), htaccessContent);

    // Step 8: Create a deployment README
    const readmeContent = `# Gudang Mitra CloudPanel Deployment

## Deployment Instructions

1. Upload all files in this directory to your CloudPanel account at: ${CLOUDPANEL_USERNAME}@${CLOUDPANEL_DOMAIN}:${DEPLOY_PATH}

2. Set up the Node.js application in CloudPanel:
   - Go to CloudPanel > Sites > Your Site > Node.js
   - Create a new Node.js application
   - Set the Node.js version to 18.x or higher
   - Set the Application mode to Production
   - Set the Application root to ${DEPLOY_PATH}
   - Set the Application startup file to server.js

3. Start the Node.js application

4. Make sure your database is set up correctly:
   - The database should be named: your_db_name
   - The database user should be: your_db_user
   - The password is set in the .env file

5. Visit your website to verify the deployment

## Troubleshooting

If you encounter any issues:
1. Check the Node.js application logs in CloudPanel
2. Verify that the database connection is working
3. Make sure the .htaccess file is properly configured`;

    await fs.writeFile(path.join(deployDir, "README.md"), readmeContent);

    console.log("Deployment package created successfully!");
    console.log(`Files are ready in the '${deployDir}' directory.`);
    console.log(
      "Upload these files to your CloudPanel account to complete the deployment."
    );
  } catch (error) {
    console.error("Deployment preparation failed:", error);
  }
}

// Run the deployment script
deployToCloudPanel().catch((error) => {
  console.error("Deployment script failed:", error);
});
