# 004 Embed Cart Items

- Status: Accepted

## Context

A cart is read and updated as one user-owned aggregate.

## Decision

Embed cart items in `carts.items[]` and enforce one active cart per user with a unique `userId` index.

## Alternatives Considered

- Create a `cart_items` collection.

## Consequences

Cart reads are simple and item updates can be atomic within one document. Service logic must avoid duplicate product entries.
