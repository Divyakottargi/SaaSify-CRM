# SaaSify CRM

SaaSify CRM is a multi-tenant Customer Relationship Management system developed as a Full Stack Development project.

## Project Overview

The system provides a foundation for managing CRM users, workspaces, leads and authentication.

The application follows a multi-tenant architecture where CRM data is associated with a workspace using `workspace_id`.

## Technologies Used

### Frontend
- React
- Vite
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js
- REST API

### Database
- PostgreSQL
- Neon PostgreSQL

### Authentication & Security
- JWT
- bcrypt
- Role-Based Access Control (RBAC)
- Environment variables
- Parameterized SQL queries

### Testing & CI/CD
- Node.js built-in test runner
- GitHub Actions

## Current Features

### Authentication
- User login
- User registration
- Password hashing using bcrypt
- JWT authentication
- Protected API routes
- Logout

### Role-Based Access Control
- Admin role
- Sales representative role
- Role-based API protection

### Workspace Isolation
- Users belong to a workspace
- Lead records contain `workspace_id`
- API queries filter data by the authenticated user's workspace

### Lead Management
- Create leads
- View leads
- Lead count
- Lead status
- Soft delete leads

### Dashboard
- Total leads
- User information
- Recent activity section
- CRM navigation

## API Endpoints

### Health Check

GET `/api/health`

Checks whether the backend is running.

### Database Test

GET `/api/db-test`

Checks the PostgreSQL database connection.

### Authentication

POST `/api/auth/register`

Registers a new user.

POST `/api/auth/login`

Logs in an existing user and returns a JWT token.

POST `/api/auth/logout`

Logs out the user.

### Profile

GET `/api/profile`

Protected route that requires a valid JWT.

### Leads

GET `/api/leads`

Returns active leads belonging to the user's workspace.

POST `/api/leads`

Creates a new lead in the user's workspace.

GET `/api/leads/count`

Returns the total number of active leads.

DELETE `/api/leads/:id`

Soft deletes a lead belonging to the user's workspace.

### Admin

GET `/api/admin-test`

Admin-only protected endpoint used to verify RBAC.

## Project Structure

```text
SaaSify-CRM/
│
├── backend/
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   └── leads.js
│   │
│   ├── test/
│   │   └── api.test.js
│   │
│   ├── db.js
│   ├── database.sql
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── node-ci.yml
│
├── database/
├── tests/
├── docs/
├── .gitignore
└── README.md