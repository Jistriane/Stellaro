# Post-Launch Operations Guide - Stellaro DeFi

This guide outlines the critical operational tasks, monitoring requirements, and emergency procedures for maintaining the Stellaro DeFi platform after the Mainnet launch.

---

## 1. MONITORING & ALERTING

### Critical Metrics (Prometheus/Grafana)
- **Total Value Locked (TVL):** Monitor for sudden drops (>10% in 1h).
- **Pool Utilization:** Alert if >90% (indicates liquidity crunch).
- **Oracle Latency:** Alert if Reflector prices are stale (>5 minutes).
- **Transaction Success Rate:** Alert if >5% of Soroban transactions fail.
- **ZK Proof Verification:** Monitor for high failure rates (potential circuit issue).

### Alerts (Slack/PagerDuty)
- **Security Lock Triggered:** Immediate notification if `RiskLock` freezes an account.
- **Liquidation Failure:** Alert if a position's LTV is breached but liquidation fails.
- **Treasury Drift:** Alert if AI Agent treasury allocation deviates >5% from target.

---

## 2. KEY MANAGEMENT (HSM & ROTATION)

### Admin Keys
- **Mainnet Admin Key:** Must be stored in a hardware security module (HSM) or multi-sig.
- **Rotation Policy:**
  - Rotate API Keys (PIX/Card) every 90 days.
  - Rotate Infrastructure JWT secrets every 180 days.
  - Perform a "Fire Drill" rotation of the Soroban Admin key annually.

---

## 3. COMPLIANCE & AML

### Daily Tasks
- Review flagged PIX/Card transactions in the Admin Dashboard.
- Audit AML Screening logs for any false positives.
- Update "Internal Blocklist" based on latest industry security reports.

### Weekly Tasks
- Reconciliation report: Stellar Minted STLT vs. Bank Reserves (PIX/Cards).
- KYC verification audit: Ensure sumsub data matches internal profiles.

---

## 4. EMERGENCY PROCEDURES (Incident Response)

### Level 1: Smart Contract Bug
1. **Freeze:** Use `risklock` to freeze all critical contract interactions.
2. **Patch:** Develop and test fix in Testnet.
3. **Upgrade:** Use `governance` (DAO) to upgrade the contract WASM.
4. **Unfreeze:** Restore operations after verification.

### Level 2: Oracle Failure
1. **Circuit Breaker:** AI Agent (`RiskGuardian`) should automatically switch to "Safety Mode" (manual approval for all trades).
2. **Manual Price Entry:** Use admin keys to push temporary prices if Reflector is down.

### Level 3: Liquidity Crisis
1. **Interest Rate Adjustment:** DAO should vote to increase borrowing rates to attract lenders.
2. **Treasury Injection:** `TreasuryManager` should liquidate secondary assets to provide pool liquidity.

---

## 5. SCALING & PERFORMANCE

- **TPS Monitoring:** Monitor `BatchExecutor` performance. If average latency > 10s, increase cluster replica count.
- **Database Vacuum:** Perform weekly vacuum on PostgreSQL to optimize audit log queries.
- **Redis Eviction:** Monitor Redis memory usage; ensure TTL is respected for session tokens.

---

**Stellaro Operations Team**  
*Mainnet Live Support: 24/7*
