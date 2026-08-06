# 006 Use Idempotent Webhook Events

- Status: Accepted

## Context

Payment providers can deliver webhook events more than once.

## Decision

Store webhook events in `payment_webhook_events` with a unique `providerEventId`.

## Alternatives Considered

- Process webhooks without persistence.
- Store only the latest payment provider status on `payments`.

## Consequences

Webhook handling can be idempotent in later phases and failed events can be inspected. Raw payload storage is allowed only for this collection.
