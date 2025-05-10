import fs from 'fs';
import path from 'path';

// Path to the server.js file
const serverJsPath = path.resolve('./server.js');

// Read the server.js file
console.log(`Reading server.js file from ${serverJsPath}`);
let serverJsContent = fs.readFileSync(serverJsPath, 'utf8');

// Create a backup of the original file
const backupPath = path.resolve('./server.js.bak3');
console.log(`Creating backup of server.js at ${backupPath}`);
fs.writeFileSync(backupPath, serverJsContent, 'utf8');

// Fix 1: Fix the getAll query
console.log('Fixing getAll query...');
let getAllQueryPattern = `          const requestsQuery = \`
            SELECT
              ir.id,
              ir.title,
              ir.description,
              c.id as category,
              ir.priority,
              ir.status,
              ir.user_id as "userId",
              ir.created_at as "createdAt",
              ir.updated_at as "updatedAt",
              ir.approved_at as "approvedAt",
              ir.approved_by as "approvedBy",
              ir.rejected_at as "rejectedAt",
              ir.rejected_by as "rejectedBy",
              ir.rejection_reason as "rejectionReason",
              ir.fulfillment_date as "fulfillmentDate",
              ir.quantity
            FROM item_requests ir
            JOIN categories c ON ir.category_id = c.id
          \`;`;

let fixedGetAllQuery = `          const requestsQuery = \`
            SELECT
              ir.id,
              ir.title,
              ir.description,
              ir.category_id as category,
              ir.priority,
              ir.status,
              ir.user_id as "userId",
              ir.created_at as "createdAt",
              ir.updated_at as "updatedAt",
              ir.approved_at as "approvedAt",
              ir.approved_by as "approvedBy",
              ir.rejected_at as "rejectedAt",
              ir.rejected_by as "rejectedBy",
              ir.rejection_reason as "rejectionReason",
              ir.fulfillment_date as "fulfillmentDate",
              ir.quantity
            FROM item_requests ir
          \`;`;

serverJsContent = serverJsContent.replace(getAllQueryPattern, fixedGetAllQuery);

// Fix 2: Fix the getById query
console.log('Fixing getById query...');
let getByIdQueryPattern = `          const requestQuery = \`
            SELECT
              ir.id,
              ir.title,
              ir.description,
              c.id as category,
              ir.priority,
              ir.status,
              ir.user_id as "userId",
              ir.created_at as "createdAt",
              ir.updated_at as "updatedAt",
              ir.approved_at as "approvedAt",
              ir.approved_by as "approvedBy",
              ir.rejected_at as "rejectedAt",
              ir.rejected_by as "rejectedBy",
              ir.rejection_reason as "rejectionReason",
              ir.fulfillment_date as "fulfillmentDate",
              ir.quantity
            FROM item_requests ir
            JOIN categories c ON ir.category_id = c.id
            WHERE ir.id = $1
          \`;`;

let fixedGetByIdQuery = `          const requestQuery = \`
            SELECT
              ir.id,
              ir.title,
              ir.description,
              ir.category_id as category,
              ir.priority,
              ir.status,
              ir.user_id as "userId",
              ir.created_at as "createdAt",
              ir.updated_at as "updatedAt",
              ir.approved_at as "approvedAt",
              ir.approved_by as "approvedBy",
              ir.rejected_at as "rejectedAt",
              ir.rejected_by as "rejectedBy",
              ir.rejection_reason as "rejectionReason",
              ir.fulfillment_date as "fulfillmentDate",
              ir.quantity
            FROM item_requests ir
            WHERE ir.id = $1
          \`;`;

serverJsContent = serverJsContent.replace(getByIdQueryPattern, fixedGetByIdQuery);

// Fix 3: Fix the createdRequestQuery
console.log('Fixing createdRequestQuery...');
let createdRequestQueryPattern = `            const createdRequestQuery = \`
              SELECT
                ir.id,
                ir.title,
                ir.description,
                c.id as category,
                c.name as "categoryName",
                ir.priority,
                ir.status,
                ir.user_id as "userId",
                ir.created_at as "createdAt",
                ir.updated_at as "updatedAt",
                ir.quantity,
                ir.fulfillment_date as "fulfillmentDate",
                NULL as "inventoryItemId",
                NULL as "inventoryItemName",
                NULL as "inventoryQuantityAvailable",
                NULL as "inventoryQuantityReserved"
              FROM item_requests ir
              JOIN categories c ON ir.category_id = c.id
              WHERE ir.id = $1
            \`;`;

let fixedCreatedRequestQuery = `            const createdRequestQuery = \`
              SELECT
                ir.id,
                ir.title,
                ir.description,
                ir.category_id as category,
                cu.name as "categoryName",
                ir.priority,
                ir.status,
                ir.user_id as "userId",
                ir.created_at as "createdAt",
                ir.updated_at as "updatedAt",
                ir.quantity,
                ir.fulfillment_date as "fulfillmentDate",
                NULL as "inventoryItemId",
                NULL as "inventoryItemName",
                NULL as "inventoryQuantityAvailable",
                NULL as "inventoryQuantityReserved"
              FROM item_requests ir
              LEFT JOIN category_uuids cu ON ir.category_id = cu.id
              WHERE ir.id = $1
            \`;`;

serverJsContent = serverJsContent.replace(createdRequestQueryPattern, fixedCreatedRequestQuery);

// Write the fixed server.js file
console.log(`Writing fixed server.js file to ${serverJsPath}`);
fs.writeFileSync(serverJsPath, serverJsContent, 'utf8');

console.log('Server.js JOIN queries have been fixed successfully!');
console.log('You can now restart the server to apply the changes.');
