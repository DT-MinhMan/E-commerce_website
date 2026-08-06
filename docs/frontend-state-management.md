# Frontend State Management

The React SPA uses a small number of state owners:

- TanStack Query owns server state: categories, products, current user reads, cart data, orders, payments and admin dashboard/list/detail data.
- Zustand owns small client/session state such as the in-memory access token, auth status and current auth user mirror.
- URL search params own catalog search, filter, sort and pagination state.
- Local React state owns component-only form inputs and pending UI details.

## Cart State

Phase 6 cart data is server state. The cart is fetched with `useCartQuery` and updated through TanStack Query mutations. Mutation responses replace `cartKeys.current()` in the query cache.

Cart items, subtotal, item count, availability and API loading/error state are not stored in Zustand or localStorage.

On logout, user-specific query data such as the current user and current cart is removed from the query cache.

## Order And Checkout State

Phase 7 order history and order detail data are server state. They are fetched with order query keys and never copied into Zustand or localStorage.

Checkout uses the current cart query for summary data. Shipping address inputs are local controlled form state and are not persisted. On successful checkout, the order detail cache is populated from the response, order lists are invalidated and the current cart query is invalidated because the server clears the cart inside the transaction.

## Payment State

Phase 8 payment confirmation is server state. Checkout Session creation is a TanStack Query mutation and payment/order confirmation is fetched with a payment-by-order query key.

Stripe Checkout URLs, session IDs, payment status, provider IDs and order payment confirmation are not stored in Zustand or localStorage. The success page reads `orderId` from URL search params and polls the backend until the webhook-driven status reaches a terminal state or the local polling timeout is reached.

## Admin State

Phase 10 admin product, order and dashboard data is server state. It is fetched and mutated through dedicated TanStack Query keys:

- `adminProductKeys`
- `adminOrderKeys`
- `adminDashboardKeys`

Admin product and order listing filters are stored in URL search params so search/filter/sort/page survive reload and browser navigation.

Admin product forms use local controlled React state. Product lists, selected product details, order lists, selected order details and dashboard summaries are not copied into Zustand.

Admin mutations invalidate targeted query surfaces instead of clearing the whole query cache. Product mutations refresh admin/public product data and dashboard data. Stock mutations also refresh the current cart. Order status mutations refresh admin/customer order data and dashboard data.
