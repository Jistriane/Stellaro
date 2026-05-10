# Load Testing Guide

## Objective

Best practices and tooling suggestions for performance and load testing Stellaro services.

## Tools

- Use `k6` or similar for HTTP load tests
- Use Lighthouse for frontend performance audits
- Use scriptable scenarios and seeded test data for reproducible results

## Workflow

1. Define critical user journeys to test.
2. Establish baseline metrics before changes.
3. Run controlled experiments and capture telemetry.
4. Analyze p95/p99 latency and error rates.
