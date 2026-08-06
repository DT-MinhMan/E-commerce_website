# Payment Flow

## Stripe checkout

Checkout creates an immutable order snapshot and a pending Stripe payment record. It validates current product availability for user feedback, but it does not reserve or consume stock.

The customer is redirected to Stripe Checkout from the backend-created checkout session. The frontend success page never treats the redirect as proof of payment. It queries the backend payment status and polls briefly until the order/payment reaches a terminal state.

## Stripe webhook success

Only a verified Stripe webhook can finalize a payment. The webhook workflow persists the provider event id, runs the order/payment/product updates in a MongoDB transaction, and relies on the unique `providerEventId` index for duplicate delivery protection.

For successful Stripe checkout events, the backend verifies local payment amount, order amount, currency, checkout session id, and payment intent id before changing state. If the payment/order is already finalized, duplicate delivery returns safely without consuming stock again.

Stock is consumed during payment success with atomic conditional product updates:

```txt
{ _id: productId, status: "ACTIVE", stockQuantity: { $gte: quantity } }
{ $inc: { stockQuantity: -quantity } }
```

If every item can be fulfilled, the payment becomes `SUCCEEDED`, the order becomes `PAID`, and product stock is decremented in the same transaction.

If Stripe payment succeeds but local fulfillment cannot be completed, the payment remains `SUCCEEDED` and the order moves to `PAYMENT_REVIEW`. This records that money was collected and an operator must review the order. The application does not automatically refund in this phase.

## Admin operations

Phase 10 exposes `PAYMENT_REVIEW` clearly in the admin order UI and dashboard, but it does not resolve the state automatically. Admin fulfillment transitions are limited to:

- `PENDING_PAYMENT -> CANCELLED`
- `PAID -> PROCESSING`
- `PROCESSING -> SHIPPED`
- `SHIPPED -> COMPLETED`

Admin status updates include `expectedCurrentStatus`; stale updates return `ORDER_STATUS_CONFLICT`. Refund and manual reconciliation workflows remain out of scope.

## MVP limitation

This phase intentionally does not implement stock reservation. A `PENDING_PAYMENT` order does not hold inventory while the customer is on Stripe Checkout. Another successful payment may consume the last unit first; in that case, later successful payments move to `PAYMENT_REVIEW`.
