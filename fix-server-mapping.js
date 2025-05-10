import fs from 'fs';
import path from 'path';

// Path to the server.js file
const serverJsPath = path.resolve('./server.js');

// Read the server.js file
console.log(`Reading server.js file from ${serverJsPath}`);
let serverJsContent = fs.readFileSync(serverJsPath, 'utf8');

// Create a backup of the original file
const backupPath = path.resolve('./server.js.bak2');
console.log(`Creating backup of server.js at ${backupPath}`);
fs.writeFileSync(backupPath, serverJsContent, 'utf8');

// Fix the field mapping in the create request handler
console.log('Fixing field mapping in create request handler...');

// Find the section where the request fields are extracted
let extractionPattern = `const {
            id = uuidv4(),
            title,
            description,
            category,
            priority = "medium",
            status = "pending",
            userId,
            quantity = 1,
            fulfillmentDate,
            inventoryItemId,
          } = request;`;

// Replace with the correct field mapping
let fixedExtraction = `const {
            id = uuidv4(),
            title,
            description,
            category_id,
            priority = "medium",
            status = "pending",
            user_id,
            quantity = 1,
            fulfillmentDate,
          } = request;
          
          // Map fields to variables for backward compatibility
          const category = category_id;
          const userId = user_id;`;

serverJsContent = serverJsContent.replace(extractionPattern, fixedExtraction);

// Fix the insert parameters
console.log('Fixing insert parameters...');
let insertParamsPattern = `const insertParams = [
            request.id,
            title,
            description,
            category,
            priority,
            status,
            userId,
            quantity,
            fulfillmentDate ? new Date(fulfillmentDate) : null,
          ];`;

let fixedInsertParams = `const insertParams = [
            request.id,
            title,
            description,
            category_id,
            priority,
            status,
            user_id,
            quantity,
            fulfillmentDate ? new Date(fulfillmentDate) : null,
          ];`;

serverJsContent = serverJsContent.replace(insertParamsPattern, fixedInsertParams);

// Fix the logging
console.log('Fixing logging...');
let loggingPattern = `console.log("Creating request with data:", {
            id: request.id,
            title,
            description,
            category_id: category,
            priority,
            status,
            user_id: userId,
            quantity,
            fulfillment_date: fulfillmentDate,
            inventory_item_id: inventoryItemId,
          });`;

let fixedLogging = `console.log("Creating request with data:", {
            id: request.id,
            title,
            description,
            category_id,
            priority,
            status,
            user_id,
            quantity,
            fulfillment_date: fulfillmentDate,
          });`;

serverJsContent = serverJsContent.replace(loggingPattern, fixedLogging);

// Write the fixed server.js file
console.log(`Writing fixed server.js file to ${serverJsPath}`);
fs.writeFileSync(serverJsPath, serverJsContent, 'utf8');

console.log('Server.js field mapping has been fixed successfully!');
console.log('You can now restart the server to apply the changes.');
