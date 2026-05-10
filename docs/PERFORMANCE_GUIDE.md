# Performance Guide

## Objective

Provide practical guidance for keeping Stellaro responsive and stable under growth.

## Frontend Targets

- Fast first content render
- Stable layout and minimal blocking scripts
- Controlled bundle growth and route-level splitting

## Backend Targets

- Predictable API latency for critical endpoints
- Controlled DB query cost and index usage
- Short cache windows for hot read paths

## Contract and Chain Targets

- Deterministic invocation budgets
- Explicit fallback behavior for unavailable upstreams
- Safe retries only where idempotency is guaranteed

## Monitoring

Track:
- p95/p99 latency
- error rate
- saturation and queue depth
- cache hit rate

## Optimization Workflow

1. Measure before changing.
2. Isolate bottleneck source.
3. Apply minimal safe optimization.
4. Re-measure and document impact.
