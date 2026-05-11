# Etherfuse Testing Guide

Version: 2026-05-11
Status: Active

## Scope

This guide covers the current Etherfuse testing surface in Stellaro:

- Backend unit tests for service/controller behavior
- API-level manual validation for status, quote, and order endpoints
- Frontend functional checks on Pix Etherfuse UI

## Automated Tests

Latest validation snapshot (2026-05-11):

- Command: `cd apps/backend && npx jest src/payments/etherfuse.service.spec.ts src/payments/etherfuse.controller.spec.ts --runInBand`
- Result: `2 passed suites`, `9 passed tests`, `0 failed`

### Backend unit tests

Run focused Etherfuse specs from backend workspace:

```bash
cd apps/backend
npx jest src/payments/etherfuse.service.spec.ts src/payments/etherfuse.controller.spec.ts --runInBand
```

What these specs validate:

- mode resolution (`disabled`, `stub`, `live` fallback behavior)
- quote generation in stub/live modes
- order generation in stub/live modes
- controller delegation for status, quote, and order handlers
- invalid payload handling (`amount`, `quoteId`)

## API Smoke Tests

### Status check

```bash
curl -s http://localhost:3001/payments/etherfuse/status
```

Expected:

- `enabled=true` for `stub` and `live`
- `mode=stub` when live credentials are incomplete
- `mode=live` when API credentials are complete

### Quote check

```bash
curl -s -X POST http://localhost:3001/payments/etherfuse/quote \
  -H 'Content-Type: application/json' \
  -d '{"amount":"150","quoteType":"onramp"}'
```

Expected:

- HTTP 200 with `ok=true`
- `quote.id` present
- `quote.sourceAmount` and `quote.destinationAmount` present
- `quote.expiresAt` present

### Order check

```bash
curl -s -X POST http://localhost:3001/payments/etherfuse/order \
  -H 'Content-Type: application/json' \
  -d '{"quoteId":"<quote-id>"}'
```

Expected:

- HTTP 200 with `ok=true`
- `order.id` present
- `order.quoteId` matches request
- `order.status` and `order.direction` present

Negative-path checks:

- With missing `quoteId`, order endpoint should return controlled validation error.
- With `ETHERFUSE_MODE=disabled`, quote and order generation should reject with controlled error behavior.

## Frontend Validation

Manual UI checks in `/pix`:

1. Etherfuse status badge shows current mode.
2. Etherfuse metadata fields render (`blockchain`, `quote type`, source/target assets).
3. Generate Quote button behavior:
- disabled when Etherfuse is disabled
- enabled in stub/live modes
4. Generated quote panel renders:
- quote id
- source/destination amounts
- exchange rate
- expiration timestamp
5. Create Order from Quote button behavior:
- disabled before quote generation
- enabled after a valid quote is generated
6. Order panel renders:
- order id
- order status
- order direction
- guidance text

## Release Checklist (Etherfuse)

1. Focused unit tests pass.
2. API status, quote, and order smoke checks pass.
3. Pix page quote and order actions work in target mode.
4. Live-mode secrets and bank account defaults validated in target environment.
5. Evidence attached to release notes (commands + outputs).

## CI Recommendation

Add a focused Etherfuse backend test stage to avoid regressions:

```bash
cd apps/backend && npx jest src/payments/etherfuse.service.spec.ts src/payments/etherfuse.controller.spec.ts --runInBand
```

For integration environments, include API smoke checks for:

- `/payments/etherfuse/status`
- `/payments/etherfuse/quote`
- `/payments/etherfuse/order`
