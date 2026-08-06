# Phase 12 Logging, Monitoring And Performance

## Summary

Phase 12 keeps observability lightweight for the current MERN modular monolith. The app now relies on structured JSON logs, request ids, liveness/readiness probes and targeted query/frontend tuning instead of adding Redis, OpenTelemetry, Prometheus, Grafana, ELK or a vendor SDK before there is a measured need.

## Logging And Health

- Every API request gets an `x-request-id` response header. A valid incoming `x-request-id` is preserved; invalid or overly long values are replaced with a generated id.
- Request logs include `timestamp`, `level`, `message`, `requestId`, `method`, `path`, `statusCode`, `durationMs` and `userId` when authenticated.
- Checkout, Stripe Checkout Session creation and Stripe webhook processing log correlation ids such as `userId`, `orderId`, `paymentId` and `providerEventId`.
- Logs intentionally do not include request bodies, response bodies, cookies, Authorization headers, JWTs, refresh tokens, Stripe secrets, card data or raw webhook payloads.
- `GET /api/v1/health` is a lightweight liveness check.
- `GET /api/v1/ready` checks MongoDB readiness and required Stripe config presence without calling Stripe or exposing secrets.

## Query Audit

Representative backend query paths reviewed:

| Area | Query pattern | Current strategy |
| --- | --- | --- |
| Public/admin product listing | status/category/price/search filters, sort, pagination, count | Existing projections and `lean()`; max page size 50; existing `status + createdAt`, `categoryId + status`, and stock indexes retained |
| Cart | user cart plus batched product lookup | Existing user lookup, product `$in` lookup, projections and `lean()` retained |
| Checkout | cart load, product snapshot lookup, order/payment create transaction | Existing transaction retained; checkout logs added |
| Customer/admin orders | user/status/payment filters, sort by `createdAt`, pagination, count | Existing `userId + createdAt`, `orderStatus + createdAt`, `paymentStatus + createdAt` indexes retained |
| Payment status | owned order and payment by order/user | Existing order/payment indexes retained |
| Admin dashboard | revenue/status/top-products aggregations and low-stock read | Existing payment status, order status and product stock indexes retained |

No new MongoDB index was added in this phase. Existing query shapes already have targeted indexes for the core MVP paths, and regex product/order search remains an accepted MVP limitation documented in earlier phases. Before adding text indexes or analytics tables, run `explain("executionStats")` against seeded data that resembles production catalog/order volume.

## Frontend Tuning

- Axios now sends a per-request `x-request-id` while keeping access tokens memory-only.
- TanStack Query stale times are set by data type: categories are longer-lived; products/admin lists are moderate; cart/order/payment/admin dashboard remain short and rely on targeted invalidation.
- Search/list hooks continue to pass TanStack Query `AbortSignal` into Axios.
- Payment polling remains scoped to payment status screens and stops for terminal payment/order states or local timeout.
- Admin page routes are lazy-loaded so admin-only screens are not eagerly pulled into the first customer-facing route bundle.
- Server state remains in TanStack Query. Zustand remains limited to auth/session client state.

## Intentional Non-Goals

- No Redis cache for product lists.
- No OpenTelemetry, Prometheus, Grafana, ELK or monitoring vendor SDK.
- No service worker/PWA.
- No blanket `React.memo`, virtualization or broad frontend refactor.
- No index for every filterable field.
- No automatic refund, stock reservation or `PAYMENT_REVIEW` resolution workflow.

## Validation

Recommended validation commands:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm test:integration
pnpm build
```

Optional local measurement workflow:

```bash
docker compose up -d mongodb
pnpm db:seed
pnpm dev:backend
```

Then measure representative API requests with browser devtools, curl timings or a focused script, and run MongoDB `explain("executionStats")` for product listing, order listing and dashboard aggregations before adding any future index.
