# Database Design Notes

## Inventory consistency

`Product.stockQuantity` is the MVP source of truth for sellable inventory. It is a non-negative integer and must never be decremented with a read-then-write flow.

Inventory consumption happens only from the verified payment webhook success workflow. Each item is updated with a conditional atomic decrement inside a MongoDB transaction. Product ids are processed in a stable order to reduce contention surprises.

Checkout still checks current stock while building the order snapshot, but that check is not a reservation and does not change product inventory.

Admin stock updates use an absolute non-negative integer value and update only `Product.stockQuantity`. They do not create a stock ledger or audit log in Phase 10.

The product collection has an index on `stockQuantity + updatedAt` to support low-stock admin views.

## Payment and webhook consistency

`PaymentWebhookEvent.providerEventId` remains unique and is the idempotency guard for Stripe webhook delivery. Duplicate processed events do not create a second side effect.

The payment success transaction coordinates these collections:

- `payments`
- `orders`
- `products`
- `payment_webhook_events`

When payment succeeds and stock is available, `Payment.status` becomes `SUCCEEDED`, `Order.orderStatus` becomes `PAID`, and stock is decremented.

When payment succeeds but stock or verification needs manual review, `Payment.status` remains `SUCCEEDED` and `Order.orderStatus` becomes `PAYMENT_REVIEW`. This is an intentional operational state, not a payment failure.

## Admin reporting

The Phase 10 dashboard reads from existing collections only:

- Revenue is aggregated from `payments` where `status = SUCCEEDED`.
- Order status counts are aggregated from `orders`.
- Top products are aggregated from paid order item snapshots.
- Low-stock products are read from `products.stockQuantity`.

There is no separate analytics table, materialized view, event stream or realtime dashboard cache.

## Runtime requirement

MongoDB transactions require a replica set, including local and test environments that run webhook or checkout integration tests.
