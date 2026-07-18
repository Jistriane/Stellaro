# Etherfuse Integration Guide

Version: 2026-05-11
Status: Active (base integration implemented in backend and frontend)

## Purpose

This document defines the canonical Etherfuse integration surface currently implemented in Stellaro.

## Architecture Surface

Backend:
- Status endpoint: `GET /payments/etherfuse/status`
- Quote endpoint: `POST /payments/etherfuse/quote`
- Order endpoint: `POST /payments/etherfuse/order`
- Service: `apps/backend/src/payments/etherfuse.service.ts`
- Controller: `apps/backend/src/payments/etherfuse.controller.ts`

Frontend:
- API client: `apps/frontend/src/lib/etherfuse.ts`
- UI surface: Pix page (`/pix`) with the Etherfuse FX Rail card

## Runtime Modes

Etherfuse supports three modes through environment configuration:

- `disabled`: endpoints reject integration calls
- `stub`: deterministic quote/order generation for local and CI validation
- `live`: API-backed quote and order creation against Etherfuse

Mode selection key:

```env
ETHERFUSE_MODE=disabled|stub|live
```

## Required Environment Variables

Set in backend runtime configuration (`apps/backend/.env`):

```env
ETHERFUSE_MODE=live
ETHERFUSE_API_BASE_URL=https://api.sand.etherfuse.com
ETHERFUSE_API_KEY=replace-with-real-key
ETHERFUSE_CUSTOMER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

For live order creation, include bank account defaults (or pass at request time):

```env
ETHERFUSE_BANK_ACCOUNT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ETHERFUSE_WALLET_ADDRESS=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Optional quote defaults:

```env
ETHERFUSE_BLOCKCHAIN=stellar
ETHERFUSE_DEFAULT_QUOTE_TYPE=onramp
ETHERFUSE_SOURCE_ASSET=MXN
ETHERFUSE_TARGET_ASSET=USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
```

Optional stub tuning:

```env
ETHERFUSE_STUB_EXCHANGE_RATE=0.19
ETHERFUSE_STUB_FEE_BPS=35
```

Frontend backend URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Contracts

### `GET /payments/etherfuse/status`

Returns feature posture and integration metadata:

- `enabled`
- `mode`
- `apiBaseUrl`
- `blockchain`
- `defaultQuoteType`
- `defaultSourceAsset`
- `defaultTargetAsset`
- `customerIdConfigured`
- `walletAddressConfigured`
- `apiKeyConfigured`

### `POST /payments/etherfuse/quote`

Input payload:

```json
{
  "amount": "150",
  "quoteType": "onramp",
  "sourceAsset": "MXN",
  "targetAsset": "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
}
```

Response shape:

- `ok`
- `quote.id`
- `quote.mode`
- `quote.quoteType`
- `quote.sourceAmount`
- `quote.destinationAmount`
- `quote.exchangeRate`
- `quote.expiresAt`
- `quote.guidance`

### `POST /payments/etherfuse/order`

Input payload:

```json
{
  "quoteId": "<quote-id>",
  "bankAccountId": "<optional-uuid>",
  "walletAddress": "<optional-public-key>",
  "memo": "stellaro:deposit:order"
}
```

Response shape:

- `ok`
- `order.id`
- `order.mode`
- `order.quoteId`
- `order.status`
- `order.direction`
- `order.guidance`

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
curl -s http://localhost:3001/payments/etherfuse/status
```

1. Quote endpoint returns valid quote payload:

```bash
curl -s -X POST http://localhost:3001/payments/etherfuse/quote \
  -H 'Content-Type: application/json' \
  -d '{"amount":"150","quoteType":"onramp"}'
```

1. Order endpoint creates stub/live order from quoteId:

```bash
curl -s -X POST http://localhost:3001/payments/etherfuse/order \
  -H 'Content-Type: application/json' \
  -d '{"quoteId":"<quote-id>"}'
```

1. Frontend `/pix` renders mode, quote generation, and order creation actions.

## Notes and Guardrails

- Etherfuse authentication uses `Authorization: <api-key>` without Bearer prefix.
- In `live` mode, order creation requires a bank account id either in payload or `ETHERFUSE_BANK_ACCOUNT_ID`.
- If `ETHERFUSE_MODE=live` but API credentials are incomplete, service falls back to safe disabled behavior.
- Keep sandbox and production API base URLs explicit per environment profile.
