# 003 Embed Order Item Snapshots

- Status: Accepted

## Context

Orders must preserve historical product names, slugs, images and prices.

## Decision

Embed order item snapshots in the `orders` collection instead of creating an `order_items` collection.

## Alternatives Considered

- Reference products only.
- Create a separate order item collection.

## Consequences

Historical orders remain stable when product data changes. Order documents grow with item count, which is acceptable for MVP cart sizes.
