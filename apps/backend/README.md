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

1. Install dependencies.
2. Configure environment variables.
3. Run development server.
4. Execute tests and smoke checks.

## Key Quality Rules

- Validate all external inputs
- Keep service errors explicit and structured
- Preserve deterministic behavior for critical paths

## Runtime Profiles

- development
- staging
- production

Each profile must use isolated secrets and network settings.
