# Testing Guide

## Scope

Stellaro testing includes application, contract, and integration reliability checks.

## Test Levels

- Unit tests: service and contract logic
- Integration tests: module boundaries and persistence
- E2E tests: user-critical workflows
- Smoke tests: environment and deployment verification

## Minimum Quality Gates

- All critical flows pass in CI
- No unresolved high-severity failures
- Regression checks for auth, payments, and governance

## Recommended Commands

- `npm test`
- `npm run test:e2e`
- `npm run test:smoke`
- Contract-specific test commands in `contracts/`

## x402 Coverage

x402 has a dedicated integration and testing documentation set:

- Integration guide: `docs/X402_INTEGRATION.md`
- Testing guide: `docs/X402_TESTING.md`

Focused backend specs:

- `cd apps/backend && npm test -- src/payments/x402.service.spec.ts src/payments/x402.controller.spec.ts`

Required release checks for x402:

- Status endpoint returns expected mode for target environment.
- Quote endpoint returns valid settlement payload and x402 headers.
- Pix UI renders x402 posture and quote generation flow.

## Evidence

All release candidates must generate test evidence artifacts for audit trails.
