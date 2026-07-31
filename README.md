# MERN E-commerce Platform

Foundation for a single-vendor e-commerce portfolio project using React, Node.js, Express, TypeScript, MongoDB, and Mongoose.

## Technology Stack

- Frontend: React, TypeScript, Vite, React Router, Zustand, TanStack Query, Axios
- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose
- Tooling: Docker Compose, Swagger/OpenAPI, ESLint, Prettier, Vitest

## Project Structure

```text
backend/     Express API
frontend/    React SPA
docs/        Project notes
```

The foundation includes health checks, database models, seed data, authentication, role authorization, public catalog APIs, admin category/product management APIs, a customer storefront catalog UI, and authenticated customer cart behavior. Order, payment, checkout, and full admin frontend workflows are intentionally not implemented yet.

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
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN_DAYS=7
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
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

## Authentication Endpoints

Phase 3 adds email/password authentication, short-lived JWT access tokens and rotated opaque refresh tokens. Refresh tokens are stored only as SHA-256 hashes in MongoDB and sent to the browser as an httpOnly cookie scoped to `/api/v1/auth`.

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/users/me
```

Access tokens are returned in auth responses and should be sent as:

```http
Authorization: Bearer <accessToken>
```

The React app keeps the access token in memory-only Zustand auth state. TanStack Query owns server-state fetching and caching, while Axios remains the HTTP client. The app does not persist raw refresh tokens or access tokens in localStorage or sessionStorage.

Stable auth error codes include:

- `AUTH_EMAIL_ALREADY_EXISTS`
- `AUTH_INVALID_CREDENTIALS`
- `AUTH_ACCOUNT_INACTIVE`
- `AUTH_ACCOUNT_BLOCKED`
- `AUTH_TOKEN_MISSING`
- `AUTH_ACCESS_TOKEN_INVALID`
- `AUTH_REFRESH_TOKEN_INVALID`
- `AUTH_REFRESH_TOKEN_EXPIRED`
- `AUTH_REFRESH_TOKEN_REUSED`
- `AUTH_FORBIDDEN`

Detailed flow notes are documented in [docs/authentication-flow.md](docs/authentication-flow.md).

## Catalog Endpoints

Phase 4 adds public category/product APIs and ADMIN-only catalog management APIs.

Public:

```http
GET /api/v1/categories
GET /api/v1/products
GET /api/v1/products/:slug
```

Admin:

```http
GET    /api/v1/admin/categories
POST   /api/v1/admin/categories
PATCH  /api/v1/admin/categories/:id
DELETE /api/v1/admin/categories/:id

GET    /api/v1/admin/products
POST   /api/v1/admin/products
PATCH  /api/v1/admin/products/:id
DELETE /api/v1/admin/products/:id
```

Admin routes require:

```http
Authorization: Bearer <adminAccessToken>
```

Public product listing supports:

```text
page=1
limit=12
category=keyboards
minPriceMinor=1000
maxPriceMinor=20000
sort=newest|price_asc|price_desc
q=keyboard
```

Catalog rules:

- Public categories return only `ACTIVE` categories.
- Public products return only `ACTIVE` products whose category is also `ACTIVE`.
- `DELETE` category/product routes are semantic deactivations; documents are not physically deleted.
- Product/category slugs are unique and normalized lowercase.
- Product search escapes user input and uses MVP regex search on product name; no text index is added yet.

Stable catalog error codes include:

- `CATEGORY_NOT_FOUND`
- `CATEGORY_SLUG_EXISTS`
- `PRODUCT_NOT_FOUND`
- `PRODUCT_SLUG_EXISTS`
- `PRODUCT_CATEGORY_INVALID`
- `VALIDATION_ERROR`

Catalog API notes are documented in [docs/catalog-api.md](docs/catalog-api.md).

## Frontend Storefront

Phase 5 adds customer catalog browsing in the React SPA:

- `/` storefront home entry.
- `/products` product listing with category filter, price filter, search, sort and pagination stored in URL search params.
- `/products/:slug` product detail loaded from the public product API.

TanStack Query owns category/product server-state caching. Zustand remains limited to auth/session memory state. Catalog filters are not stored in Zustand.

Implemented Phase 5 frontend pieces:

- Catalog response types for public categories, products, product images, pagination and product list query params.
- Public catalog service methods using the existing Axios client.
- TanStack Query keys/hooks for active categories, product lists and product detail by slug.
- Product listing UI with API-backed categories, explicit search submit, URL-backed filters/sort/page, loading skeleton, retryable error state, empty states, product cards and pagination.
- Product detail UI with not-found handling, image/description/price/stock display and a disabled Phase 6 add-to-cart integration point.
- Responsive catalog styling and primary navigation link for `Products`.

Frontend validation run for Phase 5:

```bash
pnpm --filter @mern-ecommerce/frontend type-check
pnpm --filter @mern-ecommerce/frontend lint
pnpm --filter @mern-ecommerce/frontend build
```

All three passed. Live catalog verification still requires backend and MongoDB to be running.

## Shopping Cart

Phase 6 adds authenticated customer cart behavior. Cart data is owned by the backend and cached on the frontend with TanStack Query.

```http
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:productId
DELETE /api/v1/cart/items/:productId
DELETE /api/v1/cart
```

Cart rules:

- Cart routes require a CUSTOMER access token.
- The server takes `userId` from the authenticated request.
- The client sends only product IDs and quantities.
- Prices, line totals, item count and subtotal are calculated from current product data.
- Adding or updating items rejects inactive products and quantities above current stock.
- Existing cart items are not silently deleted when product stock/status changes; cart responses mark unavailable items with `isAvailable: false`.
- Cart is not stock reservation.

The React app exposes `/cart`, a navigation cart badge, product-list add buttons and product-detail add-to-cart integration. Cart data is not copied into Zustand or localStorage.

Detailed flow notes are documented in [docs/cart-flow.md](docs/cart-flow.md).

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

To seed MongoDB Atlas, set `MONGODB_URI` to the Atlas connection string and run the same command:

```bash
pnpm db:seed
```

Make sure the Atlas database user is valid and the current IP is allowed in Network Access. Avoid running reset commands against shared or production Atlas databases.

Reset only known seed records and seed again:

```bash
pnpm db:seed:reset
```

The reset script refuses to run when `NODE_ENV=production`.

## Current Project Status

Phase 6 includes authentication, authorization, public catalog reads, admin category/product management APIs, customer storefront catalog browsing, and authenticated customer cart behavior. The storefront uses TanStack Query for catalog/cart server state and URL search params for catalog filters. Order, payment, checkout, image upload, variants, reviews and wishlist APIs are intentionally not implemented yet.

## Next Phase

Phase 7 should introduce checkout and order creation without trusting client-side prices or totals.
