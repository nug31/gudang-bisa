# Mock Data for Gudang Mitra

This directory contains mock data files that can be used as a backup for the database. These files are automatically generated and can be used when the real database connection is not available or when you want to develop without connecting to the real database.

## Files

- `mockData.json`: Contains the mock data in JSON format for all database tables
- `mockData.sql`: Contains SQL insert statements to populate the database with mock data

## How to Use

### Using Mock Data in Development

1. Set `USE_MOCK_DB=true` in your `.env` file
2. The application will automatically use the mock data instead of connecting to the real database

### Regenerating Mock Data

If you want to regenerate the mock data:

```bash
node scripts/generate-mock-data.js
```

### Setting Up Mock Data (First Time)

If you're setting up the mock data for the first time:

```bash
node scripts/setup-mock-data.js
```

This script will:
1. Create the necessary directories
2. Generate the mock data
3. Update your `.env` file to use the mock data

### Switching Back to Real Database

To switch back to using the real database:

1. Set `USE_MOCK_DB=false` in your `.env` file
2. Make sure your IP address is whitelisted in cPanel:
   - Go to cPanel > MySQL Databases > Remote MySQL
   - Add your IP address to the allowed list

## Data Structure

The mock data includes the following tables:

- `users`: User accounts with roles (admin, manager, user)
- `categories`: Categories for inventory items and requests
- `item_requests`: Inventory requests with status tracking
- `comments`: Comments on inventory requests
- `notifications`: User notifications for various events

## Notes

- The mock data is designed to mimic the real database structure
- All relationships between tables are maintained (foreign keys)
- The data includes a variety of scenarios (approved requests, rejected requests, etc.)
- User passwords are hashed for security
