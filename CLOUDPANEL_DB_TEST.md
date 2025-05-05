# Testing CloudPanel Database Connection

This guide will help you test the connection to your CloudPanel MySQL database.

## Prerequisites

1. Your CloudPanel database credentials:
   - Database host (usually localhost)
   - Database name
   - Database username
   - Database password
   - Database port (usually 3306)

2. Node.js installed on your local machine

## Step 1: Update Your .env File

1. Open the `.env` file in the root of your project
2. Update the database connection settings with your CloudPanel credentials:

```
DB_HOST=localhost
DB_USER=your_cloudpanel_db_user
DB_PASSWORD=your_cloudpanel_db_password
DB_NAME=your_cloudpanel_db_name
DB_PORT=3306
USE_MOCK_DB=false
```

## Step 2: Run the Database Connection Test

Run the CloudPanel database connection test script:

```bash
npm run test-cloudpanel-db
```

This script will:
1. Connect to your CloudPanel database using the credentials in your `.env` file
2. Execute a simple test query
3. Report whether the connection was successful or not

## Step 3: Troubleshooting

If the connection test fails, you might see one of the following errors:

### Access Denied Error

```
❌ Error connecting to CloudPanel database: Error: Access denied for user 'your_user'@'your_ip' (using password: YES)
```

Possible solutions:
1. Verify that the username and password in your `.env` file are correct
2. Check if the database user has the necessary permissions
3. Make sure the user is allowed to connect from your IP address

### Host Not Found Error

```
❌ Error connecting to CloudPanel database: Error: getaddrinfo ENOTFOUND your_host
```

Possible solutions:
1. Verify that the hostname in your `.env` file is correct
2. Check if the domain is properly configured
3. Try using 'localhost' or '127.0.0.1' instead of a domain name

### Connection Timeout Error

```
❌ Error connecting to CloudPanel database: Error: connect ETIMEDOUT
```

Possible solutions:
1. Check if the server is reachable
2. Verify that the port is correct and open
3. Check if there's a firewall blocking the connection

## Step 4: Testing with the CloudPanel Server

Once you've confirmed the database connection works, you can test the full application:

1. Start the CloudPanel-specific server:

```bash
npm run start-cloudpanel
```

2. Visit http://localhost:8080/api/test-db in your browser

This endpoint will test the database connection and return a JSON response indicating whether the connection was successful.

## Additional Resources

- For more detailed database troubleshooting, refer to the CloudPanel documentation: https://www.cloudpanel.io/docs/v2/frontend-area/databases/
- If you continue to have issues, contact your CloudPanel administrator or hosting provider
