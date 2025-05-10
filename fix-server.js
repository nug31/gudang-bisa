import fs from 'fs';
import path from 'path';

// Path to the server.js file
const serverJsPath = path.resolve('./server.js');

// Read the server.js file
console.log(`Reading server.js file from ${serverJsPath}`);
let serverJsContent = fs.readFileSync(serverJsPath, 'utf8');

// Create a backup of the original file
const backupPath = path.resolve('./server.js.bak');
console.log(`Creating backup of server.js at ${backupPath}`);
fs.writeFileSync(backupPath, serverJsContent, 'utf8');

// Fix 1: Modify the INSERT query to remove the inventory_item_id column
console.log('Fixing INSERT query...');
let originalInsertQuery = `INSERT INTO item_requests (
              id,
              title,
              description,
              category_id,
              priority,
              status,
              user_id,
              quantity,
              fulfillment_date,
              inventory_item_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

let fixedInsertQuery = `INSERT INTO item_requests (
              id,
              title,
              description,
              category_id,
              priority,
              status,
              user_id,
              quantity,
              fulfillment_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

serverJsContent = serverJsContent.replace(originalInsertQuery, fixedInsertQuery);

// Fix 2: Modify the insert parameters to remove the inventory_item_id parameter
console.log('Fixing insert parameters...');
let originalInsertParams = `const insertParams = [
            request.id,
            title,
            description,
            category,
            priority,
            status,
            userId,
            quantity,
            fulfillmentDate ? new Date(fulfillmentDate) : null,
            inventoryItemId || null,
          ];`;

let fixedInsertParams = `const insertParams = [
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

serverJsContent = serverJsContent.replace(originalInsertParams, fixedInsertParams);

// Fix 3: Modify the SELECT query to remove the inventory_item_id column references
console.log('Fixing SELECT query...');
let originalSelectColumns = `ir.inventory_item_id as "inventoryItemId",
                CASE WHEN ii.id IS NOT NULL THEN ii.name ELSE NULL END as "inventoryItemName",
                CASE WHEN ii.id IS NOT NULL THEN ii.quantity_available ELSE NULL END as "inventoryQuantityAvailable",
                CASE WHEN ii.id IS NOT NULL THEN ii.quantity_reserved ELSE NULL END as "inventoryQuantityReserved"`;

let fixedSelectColumns = `NULL as "inventoryItemId",
                NULL as "inventoryItemName",
                NULL as "inventoryQuantityAvailable",
                NULL as "inventoryQuantityReserved"`;

serverJsContent = serverJsContent.replace(originalSelectColumns, fixedSelectColumns);

// Fix 4: Modify the JOIN to remove the inventory_items table
console.log('Fixing JOIN clause...');
let originalJoin = `JOIN categories c ON ir.category_id = c.id
              LEFT JOIN inventory_items ii ON ir.inventory_item_id = ii.id`;

let fixedJoin = `JOIN categories c ON ir.category_id = c.id`;

serverJsContent = serverJsContent.replace(originalJoin, fixedJoin);

// Write the fixed server.js file
console.log(`Writing fixed server.js file to ${serverJsPath}`);
fs.writeFileSync(serverJsPath, serverJsContent, 'utf8');

console.log('Server.js file has been fixed successfully!');
console.log('You can now restart the server to apply the changes.');
