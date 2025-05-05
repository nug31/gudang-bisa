# System Patterns

## Architecture Overview
The application follows a layered architecture pattern with the following key components:

1. **Presentation Layer**: Express.js routes handling HTTP requests/responses
2. **Business Logic Layer**: Route handlers containing core application logic
3. **Data Access Layer**: Database connection pooling and query execution
4. **Configuration Layer**: Environment variables managed through dotenv

## Key Technical Decisions

### 1. Database Abstraction
- **Connection Pooling**: Implemented using mysql2/promise for efficient database connection management
- **Mock Database Support**: Built-in mock database (mock-db.js) for development and testing
- **Environment-Based Configuration**: Database mode controlled by USE_MOCK_DB environment variable

### 2. Authentication & Security
- **Password Hashing**: Implemented with bcryptjs for secure password storage
- **Role-Based Access**: Built-in role validation in route handlers (user, manager, admin)
- **Environment Variables**: Sensitive configuration stored in .env file

### 3. API Design
- **RESTful Patterns**: Consistent endpoint structure with standard HTTP methods
- **CRUD Operations**: Standardized create, read, update, delete patterns across resources
- **Error Handling**: Comprehensive error handling with appropriate status codes
- **Request Validation**: Input validation in all critical endpoints

## Design Patterns

### 1. Strategy Pattern
- Implemented through database connection strategy selection (mock vs real database)
- Allows seamless switching between development and production database environments

### 2. Middleware Pattern
- Express middleware for:
  - CORS handling
  - JSON body parsing
  - Authentication checks (in login/register flows)

### 3. Repository Pattern
- Database operations encapsulated in route handlers, providing abstraction from raw SQL queries
- Consistent query structure across different database operations

## Component Relationships

### 1. Server Configuration
- Express app setup → Middleware configuration → Route registration → Server listening

### 2. Database Flow
- Environment config → Connection pool creation → Query execution → Result handling

### 3. Authentication Flow
- User input → Validation → Database lookup → Password comparison → Response generation

## Critical Implementation Paths

### 1. Database Connection
1. Load environment variables
2. Determine database mode (mock/real)
3. Create connection pool
4. Implement query execution with connection acquisition/release
5. Handle connection errors gracefully

### 2. User Registration
1. Input validation
2. Email uniqueness check
3. Password hashing
4. User creation with UUID
5. Response generation with sanitized user data

### 3. Request Management
1. Action determination (create, read, update, delete)
2. Input validation
3. Database operation execution
4. Related data handling (e.g., comments with requests)
5. Response generation with appropriate status codes
