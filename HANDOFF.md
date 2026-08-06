# HANDOFF.md

## Current goal

Phase 9 Inventory Consistency has been implemented. Checkout no longer reserves/decrements stock; verified Stripe success webhooks finalize payment and consume stock atomically.

## Files changed

- `backend/src/modules/orders/order.service.ts`: removed stock decrement from checkout.
- `backend/src/modules/payments/stripe.webhook.service.ts`: added stock pre-check, conditional atomic decrement, idempotent success handling and `PAYMENT_REVIEW`.
- `backend/test/order.test.ts`, `backend/test/payment.test.ts`: updated checkout and webhook inventory coverage.
- `frontend/src/hooks/usePaymentQueries.ts`, `frontend/src/pages/PaymentSuccessPage.tsx`: terminal payment invalidates payment/order/cart/product queries.
- Docs updated locally: `README.md`, `docs/payment-flow.md`, `docs/database-design.md`. Note: `.gitignore` ignores `docs/`.

## Commands run

- `npm run type-check` in `backend`: passed.
- `npm run lint` in `backend`: passed.
- `npm run type-check` in `frontend`: passed with escalation for tsbuildinfo writes.
- `npm run lint` in `frontend`: passed.
- `npm run build` in `backend` and `frontend`: passed with escalation for build output writes.
- `npm run test` in `backend`: blocked by `ECONNREFUSED 127.0.0.1:27017`.

## Known issues / blockers

- Backend DB tests need rerun with MongoDB running as replica set `rs0`.
- Manual Stripe CLI E2E was not run here.
- `docs/` is ignored, so docs edits may require explicit handling if committing.

## Decisions

- `PENDING_PAYMENT` orders do not hold stock in Phase 9.
- Verified Stripe success webhook is the only stock consumption point.
- Duplicate webhooks and already-succeeded payments do not decrement stock again.
- Payment success plus insufficient stock or verification mismatch becomes `Payment.SUCCEEDED` + `Order.PAYMENT_REVIEW`.
- No stock reservation, Redis lock, queue, inventory ledger or automatic refund was added.

## Next step

Rerun backend tests with MongoDB replica set running, then start the next phase around `PAYMENT_REVIEW` admin operations, manual refund support and customer-facing review messaging.
