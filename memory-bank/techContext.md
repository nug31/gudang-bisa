# Technical Context

## Technologies Used

### 1. Backend Stack
- **Node.js**: Runtime environment for server-side execution
- **Express.js**: Web framework for building the API endpoints
- **MySQL2/Promise**: Database driver for MySQL with promise support
- **Bcrypt.js**: Library for secure password hashing
- **UUID**: Library for generating unique user identifiers
- **Dotenv**: Configuration management for environment variables
- **CORS**: Middleware for handling cross-origin resource sharing
- **Body-parser**: Middleware for parsing JSON request bodies

### 2. Frontend Stack
- **React (Vite)**: Frontend framework for building the user interface
- **TypeScript**: Typed JavaScript superset for improved code quality
- **Tailwind CSS**: Utility-first CSS framework for styling
- **ESLint**: Code linting and quality checking
- **PostCSS**: CSS processing tool

### 3. Database
- **MySQL**: Relational database for production environment (via cPanel)
- **Mock Database**: In-memory database for development and testing
- **SQL Scripts**: Various SQL files for database setup and migrations

## Development Setup

### 1. Project Structure
- **Root Directory**: Contains main server file (server.js), configuration files, and scripts
- **src Directory**: Contains Express routes, database connection, React components, and context providers
- **public Directory**: Static assets like favicon and Excel templates
- **scripts Directory**: Utility scripts for data generation and setup
- **supabase Directory**: Database migration scripts

### 2. Environment Configuration
- **.env File**: Stores sensitive configuration values:
  - DB_HOST: Database host address
  - DB_USER: Database username
  - DB_PASSWORD: Database password
  - DB_NAME: Database name
  - USE_MOCK_DB: Flag to use mock database (true/false)
  - PORT: Server port number

### 3. Development Tools
- **Vite**: Build tool for the frontend React application
- **ESLint**: Code quality and style enforcement
- **Prettier**: Code formatting
- **Git**: Version control

## Technical Constraints

### 1. cPanel Deployment Requirements
- Must use environment variables for database configuration
- Requires proper error handling for database connections
- Should gracefully handle connection pool limitations
- Needs to be compatible with cPanel's MySQL configuration

### 2. Security Constraints
- Passwords must be hashed using bcrypt
- Sensitive information must be stored in environment variables
- Input validation required for all endpoints
- Proper error handling to avoid exposing sensitive information

## Dependencies

### 1. Key Dependencies
- **Express**: Web framework
- **MySQL2**: Database driver
- **Bcryptjs**: Password hashing
- **UUID**: Unique identifier generation
- **CORS**: Cross-origin resource sharing
- **Body-parser**: Request body parsing
- **Dotenv**: Environment variable management

### 2. Development Dependencies
- **Vite**: Frontend build tool
- **TypeScript**: Type system for JavaScript
- **ESLint**: Code quality tool
- **Prettier**: Code formatter
- **Tailwind CSS**: Utility-first CSS framework

## Tool Usage Patterns

### 1. Database Tools
- **check-db-connection.js**: Verifies database connection
- **check-db-tables.js**: Validates database schema
- **init-database.js**: Initializes database structure
- **insert-sample-data.js**: Populates database with sample data
- **export-database.js**: Exports database contents

### 2. Development Scripts
- **dev**: Starts the Vite development server
- **build**: Builds the production frontend
- **lint**: Runs ESLint for code quality
- **preview**: Runs the built application
- **server**: Starts the Node.js server
- **start**: Runs both server and frontend concurrently

### 3. Testing Tools
- **test-api.js**: API endpoint testing
- **test-db-connection.js**: Database connection testing
- **test-mock-db.js**: Mock database functionality testing
- **verify-db-connection.js**: Comprehensive database verification
