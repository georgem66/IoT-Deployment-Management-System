# IoT Security Backend

A robust NestJS-based backend API for IoT device management and security monitoring.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `REDIS_URL`: Redis connection string (optional)

## Available Scripts

- `npm run start:dev` - Development server with hot reload
- `npm run start:prod` - Production server
- `npm run build` - Build application
- `npm run test` - Run tests

## API Documentation

Swagger documentation available at `/api/docs` when server is running.

## Architecture

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth
- **Real-time**: WebSocket support
- **Caching**: Redis (optional)
- **Security**: Helmet, CORS, rate limiting
