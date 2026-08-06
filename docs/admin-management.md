# Admin Product, Inventory And Order Management

Phase 10 adds operational admin workflows for products, inventory, orders and a small dashboard. The implementation extends the existing modular monolith; it does not introduce a generic admin framework, Redux, a chart library, stock reservation or a refund workflow.

## Admin APIs

All admin endpoints require a valid `ADMIN` access token.

```http
GET    /api/v1/admin/products
POST   /api/v1/admin/products
GET    /api/v1/admin/products/:id
PATCH  /api/v1/admin/products/:id
PATCH  /api/v1/admin/products/:id/stock
PATCH  /api/v1/admin/products/:id/status
DELETE /api/v1/admin/products/:id

GET    /api/v1/admin/orders
GET    /api/v1/admin/orders/:orderId
PATCH  /api/v1/admin/orders/:orderId/status

GET    /api/v1/admin/dashboard/summary
```

Admin product listing supports URL/API query filters:

- `page`, `limit`
- `q`
- `category` as category slug
- `status`: `ACTIVE` or `INACTIVE`
- `stockState`: `in_stock`, `low_stock` or `out_of_stock`
- `sort`: `newest`, `price_asc` or `price_desc`

Admin order listing supports:

- `page`, `limit`
- `q` for order number search
- `orderStatus`
- `paymentStatus`

## Product And Inventory Rules

Product create/update still validates category, slug, price, stock, images and status on the server. Clients cannot send `_id`, timestamps, Mongo operators or unknown fields.

Stock updates use an absolute-value contract:

```json
{
  "stockQuantity": 12
}
```

`stockQuantity` must be a non-negative integer. The endpoint only updates the stock field with `$set`; it does not accept delta adjustments or adjustment reasons in this phase.

Product status updates use:

```json
{
  "status": "ACTIVE"
}
```

Activating a product requires its category to exist and be `ACTIVE`. Product delete remains semantic deactivation via `INACTIVE`; products are not hard-deleted.

## Order Status Rules

Admin status updates are enforced by the backend state machine. The client sends both the desired next state and the state it last saw:

```json
{
  "expectedCurrentStatus": "PAID",
  "nextStatus": "PROCESSING"
}
```

Allowed Phase 10 transitions:

- `PENDING_PAYMENT -> CANCELLED`
- `PAID -> PROCESSING`
- `PROCESSING -> SHIPPED`
- `SHIPPED -> COMPLETED`

If the stored status no longer matches `expectedCurrentStatus`, the API returns `409 ORDER_STATUS_CONFLICT`. Invalid transitions return `400 ORDER_STATUS_TRANSITION_INVALID`.

`PAYMENT_REVIEW` is visible in the admin UI, but Phase 10 intentionally does not add a resolution, refund or reconciliation workflow. `REFUNDED` is reserved for a future refund workflow.

## Dashboard Scope

`GET /api/v1/admin/dashboard/summary` returns:

- Paid revenue from `Payment.status = SUCCEEDED`.
- Total order count.
- Orders grouped by order status.
- Low-stock products.
- Top products by sold quantity from paid/fulfilled order states.

Pending, processing, failed or unpaid payments are not counted as revenue. The dashboard is query/refetch based; it does not use websocket realtime updates.

## Frontend State

Admin server state is owned by TanStack Query through dedicated keys:

- `adminProductKeys`
- `adminOrderKeys`
- `adminDashboardKeys`

Admin product and order listing filters live in URL search params. Zustand remains limited to auth/session state and small UI state; product lists, order lists and dashboard summaries are not copied into Zustand.

Admin product forms use local controlled React state in this phase. React Hook Form is not installed.

Mutation invalidation is targeted:

- Product create/update/status invalidates admin product surfaces, public product surfaces and dashboard summary.
- Stock update also invalidates the current cart query.
- Order status update invalidates admin order surfaces, customer order surfaces and dashboard summary.
