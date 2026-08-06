# Cart Flow

Phase 6 adds authenticated customer shopping carts. Cart data belongs to the backend and is exposed to the React SPA through TanStack Query.

## Ownership

- `/api/v1/cart` routes require a valid customer access token.
- `userId` is always taken from the authenticated request.
- The client never sends cart owner, prices, line totals, subtotal or currency totals.
- Each customer has at most one cart through the unique `carts.userId` index.

## Operations

```http
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:productId
DELETE /api/v1/cart/items/:productId
DELETE /api/v1/cart
```

Add and update requests accept only `productId` and/or `quantity`. Quantity must be an integer greater than or equal to `1`.

## Current Price Rule

Cart responses are calculated from current product records:

- `unitPriceMinor` comes from the product document at response time.
- `lineTotalMinor` and `subtotalMinor` are calculated by the server.
- `itemCount` is the sum of quantities in the cart.
- Cart items do not snapshot product prices; order creation in a later phase must create order item snapshots.

## Availability

Adding or updating an item requires the product to exist, be `ACTIVE` and have enough stock for the requested quantity.

`GET /api/v1/cart` does not silently remove existing items when stock or product status changes later. It returns `isAvailable: false` for items that are inactive, missing or above current stock. Unavailable items have `lineTotalMinor: 0` and are not included in `subtotalMinor`.

The cart is not stock reservation. Stock is only checked against current product data.

