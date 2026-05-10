# End-to-End Testing Guide

## Goal

Validate user-critical flows across frontend, backend, and contract boundaries.

## Priority Flows

- Authentication and session lifecycle
- Wallet-linked operations
- Payments and recurring actions
- Governance proposal and voting paths
- Risk dashboard and telemetry visibility

## Execution Model

- Run E2E in controlled environment with known test fixtures
- Use deterministic test accounts and seeded datasets
- Capture logs and traces for failed steps

## Validation Criteria

- No critical path failure
- No unhandled runtime errors
- Expected state transitions verified at API and UI level

## Recommended Practice

- Keep smoke subset for fast CI gate
- Run full E2E suite before release candidates
- Archive artifacts for post-release auditability
