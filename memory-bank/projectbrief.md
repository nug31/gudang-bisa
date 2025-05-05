# Project Brief

## Project Name
Inventory Request Management System

## Purpose
Create a cPanel-ready server application for managing inventory requests with user authentication, database connectivity, and CRUD operations for requests, categories, and inventory items.

## Core Requirements
1. **Database Connectivity**
   - Support both mock database (for development) and real cPanel database (for production)
   - Environment-based configuration via .env file
   - Connection pooling for database operations

2. **User Management**
   - User registration with email/password authentication
   - Role-based access control (user, manager, admin)
   - Password hashing with bcrypt
   - User profile management (name, email, department, avatar)

3. **Request Management**
   - Create, read, update, and delete item requests
   - Request tracking with status (pending, approved, rejected, fulfilled)
   - Priority levels (low, medium, high)
   - Inventory item association with stock management

4. **Category Management**
   - Create, read, update, and delete categories
   - Category-based organization of inventory items
   - Category validation for requests

5. **API Endpoints**
   - `/api/register` - User registration
   - `/api/login` - User authentication
   - `/db/requests` - Request management API
   - `/db/categories` - Category management API
   - `/api/test-connection` - Database connection testing

## Goals
1. Provide a robust backend system that can operate with both mock and real database environments
2. Implement secure user authentication with proper password handling
3. Create a flexible API for managing inventory requests and categories
4. Ensure proper database connection management with connection pooling
5. Support cPanel deployment requirements for production environment
