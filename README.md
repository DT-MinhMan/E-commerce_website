# MERN E-commerce Platform

Foundation for a single-vendor e-commerce portfolio project using React, Node.js, Express, TypeScript, MongoDB, and Mongoose.

## Technology Stack

- Frontend: React, TypeScript, Vite, React Router, Redux Toolkit, Axios
- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose
- Tooling: Docker Compose, Swagger/OpenAPI, ESLint, Prettier, Vitest

## Project Structure

```text
backend/     Express API
frontend/    React SPA
docs/        Project notes
```

Phase 1 only implements the application foundation and health check. Auth, product, cart, order, payment, and admin features are intentionally not implemented yet.

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop

## Environment Setup

Create local environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Backend variables:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mern_ecommerce
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=ChangeMe123!
SEED_CUSTOMER_EMAIL=customer@example.com
SEED_CUSTOMER_PASSWORD=ChangeMe123!
```

Frontend variables:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## How To Run MongoDB

```bash
docker compose up -d mongodb
```

## How To Run Backend

```bash
pnpm install
pnpm dev:backend
```

The API runs at `http://localhost:5000`.

## How To Run Frontend

```bash
pnpm install
pnpm dev:frontend
```

The frontend runs at `http://localhost:5173`.

## Available Scripts

- `pnpm dev`: run backend and frontend together
- `pnpm dev:backend`: run Express API
- `pnpm dev:frontend`: run React app
- `pnpm lint`: lint backend and frontend
- `pnpm type-check`: type-check backend and frontend
- `pnpm test`: run backend tests
- `pnpm test:integration`: run backend database integration tests
- `pnpm build`: build backend and frontend
- `pnpm db:indexes`: synchronize MongoDB indexes
- `pnpm db:seed`: run idempotent development seed data
- `pnpm db:seed:reset`: reset only known seed records and seed again in development/test

## API Documentation

Swagger UI is available at:

```text
http://localhost:5000/api-docs
```

## Health Endpoint

```http
GET /api/v1/health
```

Successful response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "environment": "development",
    "timestamp": "2026-07-29T00:00:00.000Z"
  },
  "meta": null
}
```

## Database Foundation

Phase 2 defines these MongoDB collections:

- `users`
- `categories`
- `products`
- `carts`
- `orders`
- `payments`
- `payment_webhook_events`
- `refresh_tokens`

Money is stored as integer minor units, for example `$49.99` is stored as `4999` in fields such as `priceMinor`, `totalMinor` and `amountMinor`. Currency is stored separately and defaults to `USD`.

Database design details are documented in [docs/database-design.md](docs/database-design.md).

Create or synchronize indexes:

```bash
pnpm db:indexes
```

Seed development data:

```bash
pnpm db:seed
```

The seed is idempotent and creates demo admin/customer users, categories and products. Demo credentials come from `backend/.env` and the example values are development-only:

```text
admin@example.com / ChangeMe123!
customer@example.com / ChangeMe123!
```

Never use seed credentials in production.

Reset only known seed records and seed again:

```bash
pnpm db:seed:reset
```

The reset script refuses to run when `NODE_ENV=production`.

## Current Project Status

Phase 2 database foundation includes Mongoose models, indexes, idempotent seed data, database docs and ADRs. Auth, product, cart, order and payment APIs are intentionally not implemented yet.

## Next Phase

Phase 3 should introduce authentication and authorization on top of the user and refresh token models.
