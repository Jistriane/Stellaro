# Backend Application

## Overview

This service implements Stellaro's core backend APIs, orchestration routines, and integration adapters.

## Responsibilities

- Authentication and session validation
- Business flow orchestration
- Contract and chain integration
- Risk/compliance checks
- Metrics and operational telemetry

## Local Development

1. Work from the monorepo root: `/home/jistriane/Stellaro/Stellaro`
2. Install dependencies with `npm install`
3. Validate the environment with `npm run doctor:local-dev`
4. Start the official local stack with `npm run dev:stack`
5. Use `npm run dev:stack:local-chain` only when local Horizon/Soroban validation is required

The canonical local operations guide is `docs/LOCAL_DEV_MODES.md`.

## Key Quality Rules

- Validate all external inputs
- Keep service errors explicit and structured
- Preserve deterministic behavior for critical paths

## Runtime Profiles

- development
- staging
- production

Each profile must use isolated secrets and network settings.

## x402 Documentation

For x402 integration and test execution details, use:

- `docs/X402_INTEGRATION.md`
- `docs/X402_TESTING.md`

## Etherfuse Integration

Etherfuse endpoints are exposed under `payments/etherfuse`:

- `GET /payments/etherfuse/status`
- `POST /payments/etherfuse/quote`

Runtime configuration uses `ETHERFUSE_*` environment variables (mode, API base URL, API key, customer ID, quote defaults).
