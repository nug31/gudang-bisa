// Script to add environment variable to Netlify
// Run this with: node add-env-var.js

import { exec } from "child_process";

const NEON_CONNECTION_STRING =
  "postgresql://neondb_owner:npg_zJqB6a8IPdEH@ep-damp-sky-a13sblwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

console.log("Adding NEON_CONNECTION_STRING environment variable to Netlify...");

exec(
  `netlify env:set NEON_CONNECTION_STRING "${NEON_CONNECTION_STRING}"`,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
    console.log("Environment variable added successfully!");
    console.log("Now run: netlify deploy --prod");
  }
);
