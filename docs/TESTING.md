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

## Evidence

All release candidates must generate test evidence artifacts for audit trails.
