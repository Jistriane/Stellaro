# x402 Testing Guide

Version: 2026-05-11
Status: Active

## Scope

This guide covers the current x402 testing surface in Stellaro:

- Backend unit tests for service/controller behavior
- API-level manual validation for status and quote endpoints
- Frontend functional checks on Pix x402 UI

## Automated Tests

Latest validation snapshot (2026-05-11):

- Command: `cd apps/backend && npm test -- src/payments/x402.service.spec.ts src/payments/x402.controller.spec.ts`
- Result: `2 passed suites`, `7 passed tests`, `0 failed`

### Backend unit tests

Run focused x402 specs from backend workspace:

```bash
cd apps/backend
npm test -- src/payments/x402.service.spec.ts src/payments/x402.controller.spec.ts
```

What these specs validate:

- mode resolution (`disabled`, `stub`, `live` fallback behavior)
- quote generation structure and deterministic fields
- controller delegation and request handling
- status endpoint contract shape

## API Smoke Tests

### Status check

```bash
curl -s http://localhost:3001/payments/x402/status
```

Expected:

- `enabled=true` for `stub` and `live`
- `mode=stub` when live credentials are incomplete
- `mode=live` when facilitator credentials are complete

### Quote check

```bash
curl -s -X POST http://localhost:3001/payments/x402/quote \
  -H 'Content-Type: application/json' \
  -d '{"amount":"25.00","asset":"STLT","intent":"deposit","memo":"stellaro:deposit"}'
```

Expected:

- HTTP 200 with `ok=true`
- `quote.sessionId` present
- `quote.headers["x402-payment-url"]` present
- `quote.settlement.expiresAt` present

Negative-path check:

- With `X402_MODE=disabled`, quote endpoint should reject quote generation with controlled error behavior.

## Frontend Validation

Manual UI checks in `/pix`:

1. x402 status badge shows current mode
2. x402 metadata fields render (`network`, `asset`, `resource`, `provider`, `facilitator`)
3. Generate Quote button behavior:
- disabled when x402 is disabled
- enabled in stub/live modes
4. Generated quote panel renders:
- quote id
- total and asset
- expiration timestamp
- payment URL and memo

## Release Checklist (x402)

1. Focused unit tests pass.
2. API status and quote smoke checks pass.
3. Pix page quote generation works in current target mode.
4. Live-mode secrets validated in target environment.
5. Evidence attached to release notes (commands + outputs).

## CI Recommendation

Add a focused x402 backend test stage to avoid regressions:

```bash
cd apps/backend && npm test -- src/payments/x402.service.spec.ts src/payments/x402.controller.spec.ts
```

For integration environments, include one API smoke step against `/payments/x402/status` and `/payments/x402/quote`.
