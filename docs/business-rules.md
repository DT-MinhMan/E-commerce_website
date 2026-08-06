# Business Rules

1. Product prices are always read from the database.
2. The frontend must not decide cart totals, checkout totals, payment amounts or revenue totals.
3. Each email belongs to only one user account.
4. Each product has one unique slug.
5. Customers can only read their own orders.
6. Only a verified Stripe webhook can mark payment as successful.
7. A webhook event must not be processed twice.
8. Orders keep immutable snapshots of product name, slug, image and price.
9. Inventory must never become negative.
10. Checkout validates stock but does not reserve or decrement stock.
11. Stock is consumed only during verified payment success using conditional atomic updates.
12. Products and orders are not hard-deleted by normal admin workflows.
13. Product stock updates from admin use an absolute non-negative integer value.
14. Order status can only change through backend-defined transitions.
15. Admin order status updates must include the current status the client saw; stale updates return conflict.
16. `PAYMENT_REVIEW` means money may have been collected but fulfillment needs operator review.
17. `REFUNDED` is reserved for a future refund/reconciliation workflow.
18. TanStack Query owns server state; Zustand must not store product, cart, order, payment or dashboard data.
19. Listing filters, sort and pagination belong in URL search params.
20. Access tokens stay in memory; refresh tokens stay in HttpOnly cookies.
