# Supabase Database Setup for Gudang Mitra

This guide will help you set up the Supabase database for the Gudang Mitra application.

## Prerequisites

1. A Supabase account
2. Access to the Supabase project dashboard

## Setup Instructions

### 1. Create a New Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in to your account
2. Click on "New Project"
3. Enter a name for your project (e.g., "Gudang Mitra")
4. Choose a database password (make sure to save this somewhere secure)
5. Choose a region closest to your users
6. Click "Create new project"

### 2. Set Up the Database Schema

1. In your Supabase project dashboard, go to the "SQL Editor" section
2. Click "New Query"
3. Copy the contents of the `supabase-schema.sql` file from this repository
4. Paste the SQL into the query editor
5. Click "Run" to execute the SQL and create the database schema

### 3. Configure Authentication

1. Go to the "Authentication" section in your Supabase dashboard
2. Under "Settings", enable the "Email" provider
3. Configure any additional authentication settings as needed

### 4. Set Up Storage (Optional)

If you want to store images for user avatars and inventory items:

1. Go to the "Storage" section in your Supabase dashboard
2. Create the following buckets:
   - `avatars` - for user profile pictures
   - `items` - for inventory item images
3. Set the privacy settings for each bucket as needed

### 5. Update Environment Variables

Update your `.env` file with your Supabase project URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in the "Settings" > "API" section of your Supabase dashboard.

## Database Schema

The database schema includes the following tables:

### Users

Stores user information including authentication details and role.

| Column        | Type      | Description                                |
|---------------|-----------|--------------------------------------------|
| id            | UUID      | Primary key                                |
| name          | VARCHAR   | User's full name                           |
| email         | VARCHAR   | User's email address (unique)              |
| password_hash | VARCHAR   | Hashed password                            |
| role          | VARCHAR   | User role (user, admin, manager)           |
| department    | VARCHAR   | User's department                          |
| avatar_url    | VARCHAR   | URL to user's profile picture              |
| created_at    | TIMESTAMP | When the user was created                  |
| updated_at    | TIMESTAMP | When the user was last updated             |

### Categories

Stores inventory categories.

| Column      | Type      | Description                  |
|-------------|-----------|------------------------------|
| id          | UUID      | Primary key                  |
| name        | VARCHAR   | Category name                |
| description | VARCHAR   | Category description         |
| created_at  | TIMESTAMP | When the category was created|

### Inventory Items

Stores inventory items.

| Column             | Type      | Description                        |
|--------------------|-----------|------------------------------------|
| id                 | UUID      | Primary key                        |
| name               | VARCHAR   | Item name                          |
| description        | VARCHAR   | Item description                   |
| category_id        | UUID      | Foreign key to categories          |
| sku                | VARCHAR   | Stock keeping unit                 |
| quantity_available | INTEGER   | Available quantity                 |
| quantity_reserved  | INTEGER   | Reserved quantity                  |
| unit_price         | DECIMAL   | Price per unit                     |
| location           | VARCHAR   | Storage location                   |
| image_url          | VARCHAR   | URL to item image                  |
| created_at         | TIMESTAMP | When the item was created          |
| updated_at         | TIMESTAMP | When the item was last updated     |

### Item Requests

Stores inventory requests from users.

| Column           | Type      | Description                           |
|------------------|-----------|---------------------------------------|
| id               | UUID      | Primary key                           |
| title            | VARCHAR   | Request title                         |
| description      | VARCHAR   | Request description                   |
| category_id      | UUID      | Foreign key to categories             |
| priority         | VARCHAR   | Priority level                        |
| status           | VARCHAR   | Request status                        |
| user_id          | UUID      | Foreign key to users                  |
| quantity         | INTEGER   | Requested quantity                    |
| total_cost       | DECIMAL   | Total cost of the request             |
| created_at       | TIMESTAMP | When the request was created          |
| updated_at       | TIMESTAMP | When the request was last updated     |
| approved_at      | TIMESTAMP | When the request was approved         |
| approved_by      | UUID      | Foreign key to users (who approved)   |
| rejected_at      | TIMESTAMP | When the request was rejected         |
| rejected_by      | UUID      | Foreign key to users (who rejected)   |
| rejection_reason | VARCHAR   | Reason for rejection                  |
| fulfillment_date | TIMESTAMP | When the request was fulfilled        |

### Comments

Stores comments on item requests.

| Column         | Type      | Description                      |
|----------------|-----------|----------------------------------|
| id             | UUID      | Primary key                      |
| item_request_id| UUID      | Foreign key to item_requests     |
| user_id        | UUID      | Foreign key to users             |
| content        | TEXT      | Comment content                  |
| created_at     | TIMESTAMP | When the comment was created     |

### Notifications

Stores user notifications.

| Column        | Type      | Description                       |
|---------------|-----------|-----------------------------------|
| id            | UUID      | Primary key                       |
| user_id       | UUID      | Foreign key to users              |
| type          | VARCHAR   | Notification type                 |
| message       | VARCHAR   | Notification message              |
| is_read       | BOOLEAN   | Whether the notification is read  |
| created_at    | TIMESTAMP | When the notification was created |
| related_item_id| UUID     | Related item ID (if applicable)   |

## Default Data

The schema includes default data:

- 4 categories: Office, Cleaning, Hardware, and Other
- 3 users: Admin, Manager, and Regular User (all with password "password")
- 5 sample inventory items

## Row Level Security (RLS)

The schema includes Row Level Security policies to control access to the data:

- Users: Everyone can view users, but only managers can create, update, or delete users
- Categories: Everyone can view categories, but only admins and managers can create, update, or delete categories
- Inventory Items: Everyone can view inventory items, but only admins and managers can create, update, or delete inventory items
- Item Requests: Everyone can view and create item requests, but users can only update or delete their own requests, while admins and managers can update or delete any request
- Comments: Everyone can view and create comments, but users can only update their own comments, while users, admins, and managers can delete their own comments
- Notifications: Users can only view, update, or delete their own notifications, but everyone can create notifications
