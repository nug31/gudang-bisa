# Gudang Mitra - Inventory Management System

Gudang Mitra is a modern inventory management system designed to streamline the process of requesting, approving, and managing inventory items in an organization.

## Features

- **User Authentication**: Secure login and registration system with role-based access control
- **Inventory Request Management**: Create, view, and manage inventory requests
- **Admin Dashboard**: Approve or reject inventory requests, manage users, and view statistics
- **Notifications**: Real-time notifications for request status changes and comments
- **Categories**: Organize inventory items by categories
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: Choose between dark and light themes

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: Neon (PostgreSQL)
- **Deployment**: Netlify

## Deployment Options

The application can be deployed using various methods:

1. **Netlify**: Deploy using Netlify with Neon as the database (recommended)
2. **Hostinger**: Deploy to Hostinger with MySQL database
3. **cPanel**: Deploy to cPanel with MySQL database
4. **Local Development**: Run locally with MySQL or mock database
5. **Supabase**: Deploy using Netlify with Supabase as the database

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/gudang-mitra.git
   cd gudang-mitra
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration

4. Start the development server:
   ```bash
   npm run start
   ```

## Deployment

### Deploying to Netlify with Neon

1. Make sure you have a Neon database set up at [neon.tech](https://neon.tech)
2. Set your Neon connection string in the `.env.production` file
3. Run the deployment script:
   ```bash
   npm run deploy-to-netlify
   ```
4. Set the following environment variables in your Netlify site settings:
   - `NEON_CONNECTION_STRING`: Your Neon database connection string
   - `JWT_SECRET`: A secret key for JWT token generation
   - `VITE_API_URL`: Your Netlify functions API URL (usually `https://your-site-name.netlify.app`)

See [NETLIFY_DEPLOY.md](NETLIFY_DEPLOY.md) for more detailed instructions.

### Deploying to Hostinger

See [HOSTINGER-DEPLOYMENT-GUIDE.md](HOSTINGER-DEPLOYMENT-GUIDE.md) for detailed instructions on deploying to Hostinger.

### Deploying to cPanel

See [CPANEL_DEPLOY.md](CPANEL_DEPLOY.md) for detailed instructions on deploying to cPanel.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Neon](https://neon.tech/)
- [Netlify](https://www.netlify.com/)
- [Supabase](https://supabase.com/)
