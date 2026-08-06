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

The foundation includes health checks, database models, seed data, authentication, role authorization, public catalog APIs, admin category/product management APIs, a customer storefront catalog UI, authenticated customer cart behavior, checkout, orders and Stripe test-mode payments. Full admin frontend workflows are intentionally not implemented yet.

## Prerequisites

- Node.js 20+
- pnpm 9.15.4+
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
MONGODB_URI=mongodb://localhost:27017/mern_ecommerce?replicaSet=rs0
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN_DAYS=7
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
STRIPE_SUCCESS_URL=http://localhost:5173/payment/success?orderId={ORDER_ID}
STRIPE_CANCEL_URL=http://localhost:5173/payment/cancel?orderId={ORDER_ID}
CLOUDINARY_CLOUD_NAME=replace_me
CLOUDINARY_API_KEY=replace_me
CLOUDINARY_API_SECRET=replace_me
CLOUDINARY_PRODUCT_FOLDER=ecommerce/products
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

Checkout and payment finalization use MongoDB transactions, so local MongoDB runs as a single-node replica set named `rs0`. If an existing standalone development volume was created before Phase 7, restart MongoDB and confirm the replica set is initialized:

```bash
docker compose up -d mongodb
docker compose exec mongodb mongosh --quiet --eval "rs.status().ok"
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
- `pnpm test`: run backend and frontend tests
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

## Health And Readiness Endpoints

```http
GET /api/v1/health
GET /api/v1/ready
```

`/health` is a lightweight liveness check. Successful response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "environment": "development",
    "timestamp": "2026-07-29T00:00:00.000Z"
  },
  "meta": null
}
```

`/ready` checks MongoDB readiness and required runtime configuration without exposing secrets or calling Stripe:

```json
{
  "success": true,
  "data": {
    "status": "ready",
    "database": "connected",
    "dependencies": {
      "mongodb": "ready",
      "stripeConfig": "configured"
    },
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
GET    /api/v1/admin/products/:id
PATCH  /api/v1/admin/products/:id
PATCH  /api/v1/admin/products/:id/stock
PATCH  /api/v1/admin/products/:id/status
DELETE /api/v1/admin/products/:id
POST   /api/v1/admin/uploads/product-image
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
- Product images can be uploaded by admins to Cloudinary, then saved on products as `images[]` URLs with optional alt text.

Stable catalog error codes include:

- `CATEGORY_NOT_FOUND`
- `CATEGORY_SLUG_EXISTS`
- `PRODUCT_NOT_FOUND`
- `PRODUCT_SLUG_EXISTS`
- `PRODUCT_CATEGORY_INVALID`
- `VALIDATION_ERROR`

Catalog API notes are documented in [docs/catalog-api.md](docs/catalog-api.md).

## Admin Product, Inventory And Order Management

Phase 10 adds operational admin workflows for products, inventory, orders and a basic dashboard.

```http
GET   /api/v1/admin/orders
GET   /api/v1/admin/orders/:orderId
PATCH /api/v1/admin/orders/:orderId/status

GET   /api/v1/admin/dashboard/summary
```

Admin product listing supports search, status, category, stock state, sort and pagination. Product stock updates use an absolute `stockQuantity` value and product/order hard delete remains out of scope.

Admin order status changes are enforced by the backend state machine. Updates include `expectedCurrentStatus`, and stale admin actions return `ORDER_STATUS_CONFLICT`.

The React admin UI includes `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/:productId/edit`, `/admin/orders` and `/admin/orders/:orderId`. Admin server state is owned by TanStack Query; listing filters live in URL search params.

Detailed admin notes are documented in [docs/admin-management.md](docs/admin-management.md).

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

## Checkout And Orders

Phase 7 adds authenticated checkout and customer order reads.

```http
POST /api/v1/orders/checkout
GET  /api/v1/orders
GET  /api/v1/orders/:orderId
```

Checkout reloads current products from MongoDB, calculates totals on the server, creates an immutable order snapshot, creates a pending Stripe payment record and clears the cart in one MongoDB transaction. It validates current stock for user feedback, but it does not reserve or decrement stock while the order is `PENDING_PAYMENT`.

Detailed flow notes are documented in [docs/checkout-flow.md](docs/checkout-flow.md).

## Stripe Payments

Phase 8 adds Stripe hosted Checkout in test mode.

```http
POST /api/v1/payments/checkout-session
GET  /api/v1/payments/orders/:orderId
POST /api/v1/webhooks/stripe
```

Create-session routes require a customer access token and only accept an `orderId`. Amount, currency and line items always come from the immutable order snapshot. The success URL is not payment confirmation; the signed Stripe webhook updates `payments`, `orders`, `products` and `payment_webhook_events`.

Phase 9 moves inventory consumption to the verified Stripe success webhook. Product stock is decremented with conditional atomic updates inside the payment finalization transaction, so duplicate webhooks do not consume stock twice and concurrent purchases cannot make `stockQuantity` negative. If Stripe reports a successful payment but local stock can no longer fulfill the order, the payment remains `SUCCEEDED` and the order moves to `PAYMENT_REVIEW` for manual handling. Automatic refunds and stock reservation are intentionally out of scope.

Local Stripe CLI workflow:

```bash
docker compose up -d mongodb
pnpm dev:backend
pnpm dev:frontend
stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe
```

Copy the printed `whsec_...` value into `backend/.env` as `STRIPE_WEBHOOK_SECRET`, then use a Stripe test card in hosted Checkout. The success page should show confirmation pending until the webhook updates the backend.

Detailed flow notes are documented in [docs/payment-flow.md](docs/payment-flow.md).

## Testing, Security And Observability

Phase 11 adds focused backend security regressions, frontend Vitest coverage and a critical-flow verification matrix. Details are documented in [docs/testing-security.md](docs/testing-security.md).

Phase 12 adds structured JSON logs, request-id propagation, readiness checks and targeted performance tuning without adding a large observability stack. Details are documented in [docs/performance.md](docs/performance.md).

## Docker, CI/CD And Deployment

Phase 13 targets Vercel for the Vite frontend, Render for the Dockerized backend, and MongoDB Atlas for the managed database. GitHub Actions runs the deployment safety checks on pull requests and pushes to `main`.

### Backend Docker Image

Build the production backend image from the repository root:

```bash
docker build -f backend/Dockerfile -t mern-ecommerce-backend:phase13 .
```

The image uses a multi-stage build, installs production dependencies only for `@mern-ecommerce/backend`, runs as the non-root `node` user, starts `node dist/server.js`, and includes a healthcheck against `/api/v1/health`. The root `.dockerignore` excludes local env files, dependencies, build outputs, caches, logs and test artifacts from the Docker build context.

### GitHub Actions CI

The workflow in `.github/workflows/ci.yml` runs:

```bash
pnpm lint
pnpm type-check
pnpm --filter @mern-ecommerce/backend test
pnpm --filter @mern-ecommerce/frontend test
pnpm test:integration
pnpm build
docker build -f backend/Dockerfile -t mern-ecommerce-backend:ci .
```

Integration tests start a local MongoDB 7 single-node replica set in CI. Production secrets are not required or used by the workflow; test and mock values come from the existing test setup.

### Vercel Frontend

Use these Vercel settings:

```text
Root Directory: frontend
Build Command: pnpm build
Output Directory: dist
Environment: VITE_API_BASE_URL=https://<render-backend-host>/api/v1
```

From the repository root, the equivalent frontend build command is `pnpm --filter @mern-ecommerce/frontend build` and the output path is `frontend/dist`.

`frontend/vercel.json` rewrites all routes to `/index.html`, so React Router direct navigation and reloads keep working for routes such as `/products`, `/orders` and `/payment/success?...`.

Client environment variables must stay public-only. Do not add Stripe secret keys, JWT secrets or database credentials to `VITE_*` variables. This app does not need `VITE_STRIPE_PUBLISHABLE_KEY` because Stripe Checkout sessions are created by the backend and the client only follows the returned Checkout URL.

### Render Backend

Deploy the backend as a Render Docker web service:

```text
Dockerfile Path: backend/Dockerfile
Health Check Path: /api/v1/health
Readiness URL: https://<render-backend-host>/api/v1/ready
```

Set production environment variables in Render, not in git:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
CLIENT_URL=https://<vercel-frontend-host>
LOG_LEVEL=info
JWT_ACCESS_SECRET=<long-random-secret>
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN_DAYS=7
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
STRIPE_SECRET_KEY=sk_live_or_test_value
STRIPE_WEBHOOK_SECRET=whsec_value_for_render_endpoint
STRIPE_SUCCESS_URL=https://<vercel-frontend-host>/payment/success?orderId={ORDER_ID}
STRIPE_CANCEL_URL=https://<vercel-frontend-host>/payment/cancel?orderId={ORDER_ID}
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_PRODUCT_FOLDER=ecommerce/products
```

`CLIENT_URL` must be the exact Vercel origin so production CORS only accepts the deployed frontend. Because Vercel and Render are different sites, keep Axios `withCredentials=true`, use HTTPS, set `COOKIE_SECURE=true`, and use `COOKIE_SAME_SITE=none` for the refresh-token cookie.

Swagger UI is currently available at `/api-docs`. Keep it public only for demo/internal environments; protect or disable it in a later phase if the production deployment needs restricted API docs.

### MongoDB Atlas

Create a least-privilege Atlas database user for the app database and allow only required network access. After the backend has valid Atlas credentials, synchronize indexes explicitly:

```bash
pnpm db:indexes
```

Do not run `pnpm db:seed:reset` against production or shared Atlas databases. Demo seed data should only be run manually and intentionally.

### Stripe Production/Test Deployment

Create a Stripe webhook endpoint for the Render backend:

```text
https://<render-backend-host>/api/v1/webhooks/stripe
```

Copy the endpoint-specific signing secret into `STRIPE_WEBHOOK_SECRET`. The success and cancel URLs should point to the Vercel frontend and include `{ORDER_ID}` exactly as shown in the env example.

### Deployment Smoke Checklist

- CI is green on the target commit.
- Vercel frontend loads and deep links reload correctly.
- `GET https://<render-backend-host>/api/v1/health` returns 200.
- `GET https://<render-backend-host>/api/v1/ready` returns 200 after Atlas and Stripe config are set.
- Register/login sets an HttpOnly secure refresh cookie and authenticated API calls include credentials.
- Stripe test Checkout completes and the signed webhook updates payment/order state.
- `pnpm db:indexes` has run against the deployed database.
- No secrets are committed to git or exposed through Vite client variables.

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

Phase 12 includes authentication, authorization, public catalog reads, admin category/product management APIs, customer storefront catalog browsing, authenticated customer cart behavior, checkout, pending order/payment creation, customer order history/detail, Stripe hosted Checkout, inventory-safe webhook payment finalization, admin product/inventory/order screens, a basic admin dashboard, structured JSON logging, liveness/readiness probes and targeted frontend/backend performance tuning. The frontend uses TanStack Query for catalog/cart/order/payment/admin server state and URL search params for listing filters and pagination. Image upload, variants, reviews, wishlist APIs, stock reservation, realtime dashboard updates, automatic refund workflows and a large observability stack are intentionally not implemented yet.

## Next Phase

The next phase should add operational handling for `PAYMENT_REVIEW`, such as review resolution, manual refund support, customer messaging and audit/history around fulfillment failures.
