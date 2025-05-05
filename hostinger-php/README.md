# Gudang Mitra PHP Backend

This is the PHP backend for the Gudang Mitra application, designed to run on Hostinger.

## Deployment Instructions

1. **Upload Files**:
   - Upload all files from this directory to your Hostinger public_html directory
   - Make sure to preserve the directory structure

2. **Set Up the Database**:
   - Log in to your Hostinger control panel
   - Navigate to the MySQL Databases section
   - Create a new database named `u343415529_itemtrack`
   - Create a new user named `u343415529_itemtrack` with password `Reddevils94_`
   - Assign all privileges to the user for the database
   - Import the `setup-database.sql` file to create the necessary tables and initial data

3. **Configure the Application**:
   - Edit the `config.php` file if you need to change any database settings
   - Make sure the database credentials match what you set up in the Hostinger control panel

4. **Test the Connection**:
   - Visit `https://your-domain.com/api/test-connection` to verify the database connection

## API Endpoints

### Authentication
- `POST /api/login` - Log in a user
- `POST /api/register` - Register a new user

### Database Operations
- `POST /db/requests` - Manage inventory requests
- `POST /db/users` - Manage users
- `POST /db/categories` - Manage categories

## Frontend Integration

Update your frontend code to use these new PHP endpoints instead of the Node.js endpoints. The request and response formats are the same, so you should only need to update the URLs.

Example:
```javascript
// Old Node.js endpoint
fetch('http://localhost:3001/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})

// New PHP endpoint
fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
```

## Default Login

After deployment, you can log in with the following credentials:
- Email: admin@example.com
- Password: password

Make sure to change this password after your first login for security reasons.
