import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Configuration
const DEPLOY_DIR = path.join(process.cwd(), "deploy-hostinger");
const DIST_DIR = path.join(process.cwd(), "dist");
const SERVER_FILES = [
  "server.js",
  "package.json",
  "package-lock.json",
  ".env.production",
  "src/db/mock-db.js",
];

// Create a production .env file
const PRODUCTION_ENV = `
DB_HOST=localhost
DB_USER=u343415529_itemtrack
DB_PASSWORD=Reddevils94_
DB_NAME=u343415529_itemtrack
DB_PORT=3306
USE_MOCK_DB=false
PORT=3001
`;

async function createDeploymentPackage() {
  try {
    console.log("Creating deployment package for Hostinger...");

    // Create deployment directory
    console.log("Creating deployment directory...");
    await fs.mkdir(DEPLOY_DIR, { recursive: true });

    // Copy server files
    console.log("Copying server files...");
    for (const file of SERVER_FILES) {
      try {
        const sourcePath = path.join(process.cwd(), file);
        const destPath = path.join(DEPLOY_DIR, file);

        // Create directory if it doesn't exist
        const destDir = path.dirname(destPath);
        await fs.mkdir(destDir, { recursive: true });

        await fs.copyFile(sourcePath, destPath);
        console.log(`Copied ${file}`);
      } catch (error) {
        console.error(`Error copying ${file}:`, error.message);
      }
    }

    // Create production .env file
    console.log("Creating production .env file...");
    await fs.writeFile(
      path.join(DEPLOY_DIR, ".env.production"),
      PRODUCTION_ENV
    );

    // Copy build files
    console.log("Copying build files...");
    await fs.mkdir(path.join(DEPLOY_DIR, "public"), { recursive: true });

    // Copy dist contents to public directory
    const distFiles = await fs.readdir(DIST_DIR);
    for (const file of distFiles) {
      const sourcePath = path.join(DIST_DIR, file);
      const destPath = path.join(DEPLOY_DIR, "public", file);

      const stats = await fs.stat(sourcePath);
      if (stats.isDirectory()) {
        // Copy directory recursively
        await execAsync(`xcopy "${sourcePath}" "${destPath}" /E /I /H`);
      } else {
        // Copy file
        await fs.copyFile(sourcePath, destPath);
      }
      console.log(`Copied ${file}`);
    }

    // Create a server.js file that serves static files
    console.log("Creating production server file...");
    const productionServer = `
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { config } from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables from .env.production
config({ path: './.env.production' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
app.get('/api/test-connection', async (req, res) => {
  try {
    console.log('Testing database connection with settings:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    const connection = await pool.getConnection();
    console.log('Database connected successfully');

    // Test a simple query
    try {
      const [result] = await connection.query('SELECT 1 as test');
      console.log('Test query result:', result);
    } catch (queryError) {
      console.error('Error executing test query:', queryError);
    }

    connection.release();
    res.json({ success: true, message: 'Database connected successfully' });
  } catch (error) {
    console.error('Error connecting to database:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting to database',
      error: error.message,
      stack: error.stack,
    });
  }
});

// Import your API routes
// ... (copy your API routes from server.js)

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA routing - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

    await fs.writeFile(
      path.join(DEPLOY_DIR, "hostinger-server.js"),
      productionServer
    );

    // Create a README file with deployment instructions
    console.log("Creating README file with deployment instructions...");
    const readmeContent = `# Gudang Mitra Deployment Package for Hostinger

## Deployment Instructions

1. Upload all files in this directory to your Hostinger hosting account
2. Set up a MySQL database on Hostinger
3. Update the .env.production file with your Hostinger database credentials
4. Install Node.js dependencies: \`npm install --production\`
5. Start the server: \`node hostinger-server.js\`

## Important Notes

- Make sure Node.js is supported on your Hostinger plan
- Configure your domain to point to this application
- Set up proper file permissions on the server
- For security, make sure your .env.production file is not publicly accessible

## Troubleshooting

If you encounter any issues:
1. Check the server logs
2. Verify database connection settings
3. Make sure all dependencies are installed correctly
4. Contact Hostinger support if Node.js applications are supported on your plan
`;

    await fs.writeFile(path.join(DEPLOY_DIR, "README.md"), readmeContent);

    // Create a package.json file for production
    console.log("Creating production package.json...");
    const packageJson = await fs.readFile(
      path.join(process.cwd(), "package.json"),
      "utf8"
    );
    const packageObj = JSON.parse(packageJson);

    // Modify package.json for production
    const productionPackage = {
      name: packageObj.name,
      version: packageObj.version,
      type: packageObj.type,
      scripts: {
        start: "node hostinger-server.js",
        test: "node test-db-connection.js",
      },
      dependencies: {
        express: packageObj.dependencies.express,
        cors: packageObj.dependencies.cors,
        mysql2: packageObj.dependencies.mysql2,
        dotenv: packageObj.dependencies.dotenv,
        bcryptjs: packageObj.dependencies.bcryptjs,
        uuid: packageObj.dependencies.uuid,
      },
    };

    await fs.writeFile(
      path.join(DEPLOY_DIR, "package.json"),
      JSON.stringify(productionPackage, null, 2)
    );

    // Create a test database connection script
    console.log("Creating database test script...");
    const testDbScript = `
import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables from .env.production
config({ path: './.env.production' });

async function testConnection() {
  console.log('Testing database connection with settings:');
  console.log({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('Database connected successfully!');

    // Test a simple query
    const [result] = await connection.query('SELECT 1 as test');
    console.log('Test query result:', result);

    await connection.end();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
}

testConnection();
`;

    await fs.writeFile(
      path.join(DEPLOY_DIR, "test-db-connection.js"),
      testDbScript
    );

    console.log("Deployment package created successfully!");
    console.log(`Package location: ${DEPLOY_DIR}`);
    console.log("\nNext steps:");
    console.log(
      "1. Update the .env.production file with your Hostinger database credentials"
    );
    console.log(
      "2. Upload the contents of the deploy-hostinger directory to your Hostinger hosting account"
    );
    console.log("3. Set up a MySQL database on Hostinger");
    console.log("4. Install dependencies and start the server on Hostinger");
  } catch (error) {
    console.error("Error creating deployment package:", error);
  }
}

createDeploymentPackage();
