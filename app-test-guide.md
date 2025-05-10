# Gudang Mitra Application Test Guide

This guide will help you test the Gudang Mitra application to ensure it's working correctly with the Neon PostgreSQL database.

## Prerequisites

1. Make sure the server is running: `node neon-final-server.js`
2. Make sure the client is running: `npm run dev`
3. Open the application in your browser: http://localhost:5173

## Test 1: Authentication

### Login Test
1. Go to the login page
2. Enter the following credentials:
   - Email: manager@gudangmitra.com
   - Password: manager123
3. Click the "Login" button
4. Expected result: You should be logged in and redirected to the dashboard

### Register Test
1. Go to the register page
2. Enter the following information:
   - Name: Test User
   - Email: testuser@gudangmitra.com
   - Password: password123
   - Role: User
   - Department: Testing
3. Click the "Register" button
4. Expected result: You should be registered and redirected to the login page

## Test 2: User Management

### View Users Test
1. Login as a manager or admin
2. Go to the "Users" page
3. Expected result: You should see a list of users from the database

### Add User Test
1. Login as a manager or admin
2. Go to the "Users" page
3. Click the "Add User" button
4. Enter the following information:
   - Name: New Test User
   - Email: newtestuser@gudangmitra.com
   - Password: password123
   - Role: User
   - Department: Testing
5. Click the "Add User" button
6. Expected result: The new user should be added to the list

### Edit User Test
1. Login as a manager or admin
2. Go to the "Users" page
3. Find a user to edit and click the "Edit" button
4. Change some information (e.g., name, department)
5. Click the "Update User" button
6. Expected result: The user information should be updated

### Delete User Test
1. Login as a manager or admin
2. Go to the "Users" page
3. Find a user to delete and click the "Delete" button
4. Confirm the deletion
5. Expected result: The user should be removed from the list

## Test 3: Inventory Management

### View Inventory Test
1. Login as any user
2. Go to the "Inventory" page
3. Expected result: You should see a list of inventory items from the database

### Add Inventory Item Test
1. Login as a manager or admin
2. Go to the "Inventory" page
3. Click the "Add Item" button
4. Enter the following information:
   - Name: Test Item
   - Description: This is a test item
   - Category: Office
   - Quantity: 10
   - SKU: TEST-001
   - Location: Shelf A1
5. Click the "Add Item" button
6. Expected result: The new item should be added to the list

### Edit Inventory Item Test
1. Login as a manager or admin
2. Go to the "Inventory" page
3. Find an item to edit and click the "Edit" button
4. Change some information (e.g., name, quantity)
5. Click the "Update Item" button
6. Expected result: The item information should be updated

### Delete Inventory Item Test
1. Login as a manager or admin
2. Go to the "Inventory" page
3. Find an item to delete and click the "Delete" button
4. Confirm the deletion
5. Expected result: The item should be removed from the list

## Test 4: Request Management

### Create Request Test
1. Login as any user
2. Go to the "Inventory" page
3. Find an item and click the "Request" button
4. Enter the following information:
   - Quantity: 2
   - Reason: Testing
5. Click the "Submit Request" button
6. Expected result: The request should be created and visible in the "Requests" page

### Approve Request Test
1. Login as a manager or admin
2. Go to the "Requests" page
3. Find a pending request and click the "Approve" button
4. Expected result: The request status should change to "Approved"

### Reject Request Test
1. Login as a manager or admin
2. Go to the "Requests" page
3. Find a pending request and click the "Reject" button
4. Enter a reason for rejection
5. Click the "Reject" button
6. Expected result: The request status should change to "Rejected"

## Troubleshooting

If you encounter any issues during testing, try the following:

1. Check the browser console for error messages
2. Check the server console for error messages
3. Make sure the server is connected to the Neon PostgreSQL database
4. Try refreshing the page
5. Try logging out and logging back in

If the issue persists, try running the client-db-test.js script in the browser console:

```javascript
// Copy and paste this into the browser console
const script = document.createElement('script');
script.src = '/client-db-test.js';
document.head.appendChild(script);
```

This script will test the database connection and attempt to fix any issues.
