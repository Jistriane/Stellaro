# STELLARO COMPLETE TECHNICAL ARCHITECTURE

## Scope

This document defines Stellaro's end-to-end technical architecture across frontend, backend, blockchain, AI automation, observability, and deployment.

## 1. System Overview

Stellaro is a multi-layer platform:
- Web and mobile applications
- API gateway and domain services
- Soroban smart contracts on Stellar
- AI risk automation services
- Data and observability stack

Core principles:
- Security-first design
- Compliance-ready operations
- Clear on-chain/off-chain boundaries
- English-first product runtime

## 2. Frontend Layer

### Web
- Next.js 16 + React
- Runtime i18n policy: single English locale in production runtime
- State: Zustand + React Query
- Wallet and signing integrations for Stellar workflows

### Mobile
- Expo/React Native
- Biometric-assisted session flows
- Secure local storage and telemetry hooks

## 3. Backend Layer

- NestJS modular architecture
- Domain modules for auth, risk, payments, governance, SSI, RWA, and analytics
- Prisma/PostgreSQL for persistence
- Redis for cache and short-lived coordination
- OpenAPI-compatible interfaces for internal/external clients

## 4. Blockchain Layer

- Soroban contracts for:
  - Stablecoin and treasury operations
  - Lending/borrowing pool primitives
  - Governance and proposal execution
  - Recurring payment orchestration
  - RWA and VC registry controls
- Defensive mechanisms: access gating, pause controls, and explicit contract integration checks

## 5. AI and Automation Layer

- ElizaOS-based risk and telemetry processing
- Event-driven threat detection and protocol health checks
- Automated notification hooks for policy and compliance actions

## 6. Security Model

- Passkey and session-based auth controls
- Service-level authorization boundaries
- Contract-level safeguards and strict validation
- Continuous dependency and runtime security checks

## 7. Observability and Reliability

- Structured logs, metrics, tracing
- Health checks and SLO-focused monitoring
- Incident response workflows with auditable evidence generation

## 8. Testing Strategy

- Unit tests for modules and contracts
- Integration tests across service boundaries
- E2E flows for critical user journeys
- Security checks and smoke validations in testnet

## 9. Deployment and Environments

- Dev/stage/prod environment separation
- Infrastructure as code for reproducibility
- Controlled release and rollback strategy
- Upgradeability: Contracts are upgradeable via Soroban WASM hash updates, restricted to Admin authorization.
- Mainnet deployment registry (contract IDs + explorer links): `mainnet_deployment_registry.json`
- Canonical contract registry (English docs): `docs/SMART_CONTRACT_DEPLOYMENT_REGISTRY.md`

## 10. Integration Priorities

- PIX Integration: Restricted to Sandbox/Testnet environments for the current phase; Mainnet implementation is out of scope for the v5 initial rollout.
- Validate contract ABI compatibility before mutation scripts
- Keep deployment and smoke scripts versioned and reproducible
- Ensure backend and contract feature flags are environment-aware

## 11. KPIs and Runtime Objectives

- Availability and error budget targets
- Transaction success rate and latency budgets
- Risk detection responsiveness
- Deployment frequency and recovery time

## 12. Canonical Policy Notes

- This file is the English canonical architecture reference.
- Legacy planning materials may exist for historical context but should not override current runtime policy.
