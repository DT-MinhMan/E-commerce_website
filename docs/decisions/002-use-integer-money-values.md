# 002 Use Integer Money Values

- Status: Accepted

## Context

Product, order and payment totals must be compared and persisted reliably.

## Decision

Store money as integer minor units such as `priceMinor`, `totalMinor` and `amountMinor`, with `currency` stored separately.

## Alternatives Considered

- Store decimal numbers in JavaScript numbers.
- Store formatted strings such as `"49.99"`.

## Consequences

Calculations avoid floating-point drift and align with payment provider amounts. Formatting becomes a presentation-layer concern.
