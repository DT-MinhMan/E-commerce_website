# 005 Separate Payment From Order

- Status: Accepted

## Context

Payment provider state, retries and reconciliation have a different lifecycle than order fulfillment.

## Decision

Store payment records in a `payments` collection linked to `orders`.

## Alternatives Considered

- Embed all payment details in `orders`.

## Consequences

Order documents stay focused on commerce state while payment data can evolve independently. MVP keeps one payment per order.
