# Schema-Based Multi-Tenancy with PostgreSQL and Supabase

A comprehensive, production-ready multi-tenancy system built with **PostgreSQL** and **Supabase** using schema-based isolation. This architecture provides complete data separation for each tenant using PostgreSQL schemas.

## Overview

This project implements a complete schema-based multi-tenancy solution where each tenant gets their own PostgreSQL schema. All tenant-specific data is completely isolated, providing strong data security and privacy boundaries.

### Key Features

- **Schema-Based Isolation**: Each tenant has their own dedicated PostgreSQL schema
- **Supabase Compatible**: Fully integrated with Supabase as the primary database provider
- **PostgreSQL Native**: Can work with any PostgreSQL database by removing just 2-3 lines of Supabase code
- **Automated Migrations**: Built-in scripts to manage database schema migrations across all tenant schemas
- **Multi-Schema Support**: Handle both public schema and tenant-specific schemas
- **Type-Safe**: Built with TypeScript for robust type checking
- **Express.js API**: RESTful API for tenant management and operations

## Architecture

### Database Structure

```
Public Schema (Shared)
├── tenants table        → Stores all tenant information
├── schema_migrations    → Tracks migration history per schema

Tenant Schemas (Isolated)
├── tenant_1
├── tenant_2
├── tenant_3
└── ...each with their own tables and data
```

### Project Structure

```
server/
├── src/
│   ├── app.ts                              # Express app configuration
│   ├── server.ts                           # Server entry point
│   ├── config/
│   │   ├── database.ts                     # Database connection config
│   │   ├── env.ts                          # Environment variables
│   │   └── supabase.ts                     # Supabase client setup
│   ├── middleware/
│   │   ├── tenant-handler.ts               # Tenant extraction middleware
│   │   ├── errorHandler.ts                 # Error handling middleware
│   │   └── httpLogger.ts                   # Request logging
│   ├── modules/
│   │   ├── tenants/                        # Tenant management module
│   │   │   ├── tenant.controller.ts
│   │   │   ├── tenant.service.ts
│   │   │   ├── tenant.repository.ts
│   │   │   ├── tenant.routes.ts
│   │   │   ├── tenant.schema.ts
│   │   │   └── tenant.types.ts
│   │   └── test/
│   │       └── test.routes.ts              # Test endpoints
│   ├── scripts/
│   │   ├── run-migrations.ts               # Run public schema migrations
│   │   ├── migrate-all-schemas.ts          # Run migrations on all tenant schemas
│   │   └── migration-status.ts             # Check migration status
│   ├── utils/
│   │   ├── schema-migration-manager.ts     # Core migration management
│   │   ├── logger.ts                       # Logging utility
│   │   ├── apiError.ts                     # Custom error handling
│   │   ├── catchAsyncErrors.ts             # Async error wrapper
│   │   └── response.ts                     # Standardized responses
│   └── logs/
│       └── application.log                 # Application logs
├── supabase/
│   ├── config.toml                         # Supabase configuration
│   └── migrations/
│       ├── public/                         # Public schema migrations
│       │   ├── 001_create_tenants_table.sql
│       │   └── 002_create_schema_migrations_table.sql
│       └── schema/                         # Tenant schema migrations
│           └── 001_create_user_profile.sql
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v12+)
- Supabase account or local PostgreSQL database
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the server directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
DATABASE_URL=your_postgres_connection_string
NODE_ENV=development
PORT=3000
```

### Running the Application

**Development Mode**
```bash
npm run dev
```

**Production Build**
```bash
npm run build
npm start
```

## Database Migration Scripts

This project includes three powerful migration scripts for managing schema changes:

### 1. **Run Public Schema Migrations**
```bash
npm run migrate
```
Executes all pending migrations on the public schema (shared tenants table and schema_migrations table).

### 2. **Run Migrations on All Tenant Schemas**
```bash
npm run migrate:schemas
```
Applies all migrations from `/supabase/migrations/schema/` to every tenant's schema. This ensures all tenants have the latest database structure.

### 3. **Check Migration Status**
```bash
npm run migrate:status
```
Displays the current migration status for all schemas, helping you identify any migration inconsistencies or pending migrations.

## Tenant Management API

### Create Tenant
```http
POST /api/tenants
Content-Type: application/json

{
  "name": "Tenant Company Name",
  "subdomain": "company-subdomain"
}
```

### List Tenants
```http
GET /api/tenants
```

### Get Tenant Details
```http
GET /api/tenants/:id
```

## Supabase vs PostgreSQL Compatibility

### Supabase Setup (Default)
The project is configured to work with Supabase out of the box:
- Uses Supabase JavaScript client for connections
- Configuration in `src/config/supabase.ts`
- Service role key for admin operations

### PostgreSQL-Only Setup
To use with a standalone PostgreSQL database, remove approximately 2-3 lines of Supabase-specific code:

1. Remove Supabase client initialization from `src/config/supabase.ts`
2. Replace with native PostgreSQL client (`pg` package) - already in dependencies
3. Update connection string in `.env` to your PostgreSQL database

The migration management system is completely independent of whether you use Supabase or PostgreSQL.

## Core Features

### Multi-Schema Migration Management
The `SchemaMigrationManager` utility handles:
- Discovering migration files from `/supabase/migrations/`
- Tracking applied migrations in the `schema_migrations` table
- Executing migrations in correct order
- Supporting both public and tenant-specific schema migrations

### Tenant Isolation
- Each tenant's data is completely isolated in their own schema
- Cross-tenant data access is prevented at the database level
- Middleware automatically extracts tenant context from requests

### Error Handling & Logging
- Comprehensive error handling with custom error classes
- Winston-based logging system with file rotation
- Request logging with Morgan middleware
- Structured error responses

## API Error Handling

The API uses standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

## Contributing

This project follows standard Git workflow for contributions. All database migrations should be placed in the appropriate directory:
- Public schema: `/supabase/migrations/public/`
- Tenant schemas: `/supabase/migrations/schema/`

## License

ISC

## Support

For issues or questions, please refer to the repository's issue tracker.
