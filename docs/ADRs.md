# Architecture Decision Records (ADRs)

## ADR-001: PostgreSQL over SQLite

**Status**: Accepted  
**Date**: 2025-12-02  
**Decision Makers**: Core Team

### Context

The initial architecture used SQLite for simplicity, but this does not scale for production workloads with high concurrency and high availability targets.

### Decision

Adopt PostgreSQL 15+ with Multi-AZ deployment on AWS RDS.

### Consequences

**Positives**:
- Supports high concurrent connection volume
- Native replication for HA
- Point-in-time backup/restore
- Strong Prisma compatibility

**Negatives**:
- Additional infrastructure cost
- More setup complexity (mitigated with Terraform)

---

## ADR-002: Reflector Network as Primary Oracle

**Status**: Accepted  
**Date**: 2025-12-02

### Context

Critical operations require low-latency, reliable pricing data.

### Decision

Use Reflector Network as primary oracle with Stellar DEX and Chainlink fallback sources.

### Rationale

| Source | Latency | Cost / 1k calls | Reliability |
|---|---|---|---|
| Reflector | <500ms | $0.01 | High |
| Stellar DEX | <1s | Free | Medium |
| Chainlink | <10s | $0.10 | High |

### Implementation Note

Use multi-source aggregation with weighted median filtering and short Redis cache windows.

---

## ADR-003: Passkey Session Keys for UX

**Status**: Accepted  
**Date**: 2025-12-02

### Context

Re-authenticating with biometrics on every operation degrades UX.

### Decision

Use short-lived session keys after initial passkey authentication to support batched actions.

### Security Model

- Session duration: 1 hour (configurable)
- Per-session amount limits
- Biometric refresh for high-value operations
- Immediate revocation capability

---

## ADR-004: 120% Minimum Collateralization

**Status**: Accepted  
**Date**: 2025-12-02

### Context

Undercollateralized stablecoins can lose peg and user trust.

### Decision

Require minimum collateralization ratio of 120%, with 150% as healthy target.

### Monitoring Policy

- Periodic ratio checks
- Warning threshold alerts
- Emergency freeze below minimum threshold
- Regular reserve publication process

---

## ADR-005: Progressive Decentralization

**Status**: Accepted  
**Date**: 2025-12-02

### Context

Launching with fully autonomous governance from day one increases exploit and operational risk.

### Decision

Use a staged decentralization roadmap:

- **Phase 1**: Multisig + timelocks + emergency admin controls
- **Phase 2**: Expanded multisig + longer timelocks + community proposal flow
- **Phase 3**: On-chain DAO governance with reduced admin authority

### Why not full DAO at day zero

- Faster response needed during early-stage incidents
- Core protocol parameters still need operational tuning
- Compliance interventions may be required in edge cases

---

## ADR-006: Stellar-Only MVP

**Status**: Accepted  
**Date**: 2025-12-02

### Context

Multi-chain from day one adds complexity and bridge-related risk.

### Decision

Keep MVP fully Stellar/Soroban. Evaluate cross-chain expansion in later phases.

### Rationale

- Lower transaction costs
- Faster finality
- Reduced architectural complexity
- Smaller attack surface in early lifecycle

---

This file is the English canonical ADR set for Stellaro.
