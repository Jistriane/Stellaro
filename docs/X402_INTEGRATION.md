# x402 Integration Guide

Version: 2026-05-11
Status: Active (base integration implemented in backend and frontend)

## Purpose

This document defines the canonical x402 integration surface currently implemented in Stellaro.

## Architecture Surface

Backend:

- Status endpoint: `GET /payments/x402/status`
- Quote endpoint: `POST /payments/x402/quote`
- Service: `apps/backend/src/payments/x402.service.ts`
- Controller: `apps/backend/src/payments/x402.controller.ts`

Frontend:

- API client: `apps/frontend/src/lib/x402.ts`
- UI surface: Pix page (`/pix`) with the x402 Settlement Rail card

## Runtime Modes

x402 supports three modes through environment configuration:

- `disabled`: endpoint responds with x402 disabled behavior
- `stub`: deterministic quote generation for local and CI validation
- `live`: facilitator-oriented quote generation for real settlement handoff

Mode selection key:

```env
X402_MODE=disabled|stub|live
```

## Required Environment Variables

Set in backend runtime configuration (`apps/backend/.env`):

```env
X402_MODE=live
X402_FACILITATOR_URL=https://your-facilitator.example.com
FACILITATOR_PROVIDER_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FACILITATOR_API_KEY=replace-with-real-key
```

Optional tuning keys:

```env
X402_NETWORK=stellar:testnet
X402_ACCEPTED_ASSET=STLT
X402_RESOURCE=/payments/x402/settle
X402_RECIPIENT=GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
X402_FEE_BPS=25
X402_TTL_SECONDS=900
```

Frontend backend URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Contracts

### `GET /payments/x402/status`

Returns feature posture and integration metadata:

- `enabled`
- `mode`
- `network`
- `acceptedAsset`
- `resource`
- `providerContractId`
- `facilitatorUrl`
- `recipient`

### `POST /payments/x402/quote`

Input payload:

```json
{
  "amount": "25.00",
  "asset": "STLT",
  "intent": "deposit",
  "memo": "stellaro:deposit"
}
```

Response shape:

- `ok`
- `quote.sessionId`
- `quote.settlement.total`
- `quote.settlement.asset`
- `quote.settlement.expiresAt`
- `quote.headers["x402-payment-url"]`
- `quote.guidance`

## Local Bring-up

1. Validate the local environment:

```bash
npm run doctor:local-dev
```

1. Start the official local stack:

```bash
npm run dev:stack
```

1. Optional: use local chain only when you need local Horizon/Soroban validation:

```bash
npm run doctor:local-chain
npm run dev:stack:local-chain
```

## Validation Checklist

1. Status endpoint returns expected mode:

```bash
curl -s http://localhost:3001/payments/x402/status
```

1. Quote endpoint returns payload with `sessionId`, settlement totals, and x402 headers:

```bash
curl -s -X POST http://localhost:3001/payments/x402/quote \
  -H 'Content-Type: application/json' \
  -d '{"amount":"25.00","asset":"STLT","intent":"deposit","memo":"stellaro:deposit"}'
```

1. Frontend `/pix` renders mode, metadata, and allows quote generation.

## Notes and Guardrails

- If `X402_MODE=live` but facilitator settings are incomplete, service falls back to `stub` mode.
- Keep `FACILITATOR_PROVIDER_CONTRACT_ID` explicit in live mode.
- For production hardening, validate required env keys at startup and fail fast in strict deployment profiles.
