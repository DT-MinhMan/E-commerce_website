# Phase 11 Testing And Security Hardening

## Goals

- Protect critical MERN e-commerce flows with focused regression tests.
- Harden realistic security boundaries without adding infrastructure that the single-instance portfolio app does not need.
- Keep TanStack Query as the frontend server-state owner and Zustand limited to memory-only auth/UI state.

## Critical Flow Matrix

| Area | Existing Coverage | Phase 11 Additions |
| --- | --- | --- |
| Auth | Register, login, refresh rotation, logout, blocked/inactive users, invalid access tokens | Refresh/logout Origin guard, cookie option assertions, route-specific limiter coverage |
| Authorization | Customer/admin route protection and order ownership | Security regression for forbidden cookie-authenticated cross-origin requests |
| Catalog | Active-only public catalog, admin validation, slug uniqueness, unknown fields | Keep existing mass-assignment/unknown-field tests as acceptance coverage |
| Cart | Add/update/remove/clear, inactive products, stock, currency, user isolation | Frontend mutation cache update test |
| Checkout/orders | Server totals, immutable snapshots, rollback, ownership, admin transitions, dashboard revenue | Frontend admin order mutation invalidation test |
| Payments/inventory | Signed webhook, duplicate events, amount/session mismatch, concurrency, `PAYMENT_REVIEW`, no partial stock decrement | Preserve existing tests; no refund/review-resolution feature in this phase |
| API errors/security | RequestId middleware and production-safe error handler | Production error contract, CORS allowed/disallowed origin, limiter standard headers |
| Frontend state | Query keys and Zustand implementation exist | Isolated QueryClient test utility, route guards, memory-only access token test |

## Commands

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm test:integration
pnpm build
```

Useful focused commands:

```bash
pnpm --filter @mern-ecommerce/backend test
pnpm --filter @mern-ecommerce/backend test:integration
pnpm --filter @mern-ecommerce/frontend test
```

## Manual Verification

Run MongoDB, backend, frontend and Stripe CLI, then verify:

1. Register a customer and log in.
2. Browse products with URL-backed search/filter/sort/pagination.
3. Add products to cart and checkout.
4. Complete Stripe Checkout with a test card.
5. Simulate/receive the signed Stripe webhook.
6. Confirm order moves to `PAID`, payment to `SUCCEEDED`, and stock decreases once.
7. Confirm customer order detail/history show the updated order.
8. Log in as admin and move order through valid fulfillment transitions.

## Accepted Non-Goals

- No 100% coverage target.
- No Redis-backed rate-limit store.
- No Cypress/Playwright E2E framework in this phase.
- No MSW unless service/Axios-boundary mocks become hard to maintain.
- No refund workflow, stock reservation, realtime dashboard, reviews, wishlist or variant work.

## Dependency Audit Notes

- Vitest was upgraded to the patched 3.2 line to resolve the critical Vitest advisory and related Vite/esbuild transitive advisories.
- `brace-expansion` is pinned with a pnpm override to the patched 1.1.17 release for ESLint transitive paths.
- `pnpm audit --audit-level moderate` still reports `react-router` RSC-mode CSRF advisory requiring `react-router-dom` 8.x. The app is a client-rendered Vite SPA and does not use React Router RSC mode; upgrading to 8.x is intentionally deferred to a dedicated runtime dependency migration.
