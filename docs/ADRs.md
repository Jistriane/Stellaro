# Architecture Decision Records (ADRs)

## ADR-001: Migration PostgreSQL over SQLite

**Status**: Accepted  
**Date**: 2025-12-02  
**Decision Makers**: Core Team

### Context

A arquitetura inicial usava SQLite para simplificar desenvolvimento, mas isso não escala para produção com milhares de usuários concorrentes e requisitos de alta disponibilidade.

### Decision

Migrar para PostgreSQL 15+ com deployment Multi-AZ no AWS RDS.

### Consequences

**Positives**:
- Suporta 10k+ conexões concorrentes
- Replicação nativa para HA
- Backup point-in-time
- Compatibility com ORMs modernos (Prisma)

**Negatives**:
- Custo adicional (~$400/mês RDS)
- Complexidade de setup (mitigado por Terraform)

### Implementation

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## ADR-002: Reflector Network as Primary Oracle

**Status**: Accepted  
**Date**: 2025-12-02

### Context

Precisamos de dados de preços com latência <500ms e alta confiabilidade para operações críticas (liquidações, swaps).

### Decision

Usar Reflector Network como oracle primário, com fallbacks para Stellar DEX e Chainlink.

### Rationale

| Fonte | Latência | Custo/1k calls | Confiabilidade |
|-------|----------|----------------|----------------|
| Reflector | <500ms | $0.01 |  |
| Stellar DEX | <1s | Grátis |  |
| Chainlink | <10s | $0.10 |  |

### Implementation

```typescript
// Multi-source aggregation com median filtering
async getAggregatedPrice(asset: string): Promise<PriceData> {
  const prices = await Promise.allSettled([
    this.fetchFromReflector(asset),
    this.fetchFromStellarDEX(asset),
    this.fetchFromChainlink(asset)
  ]);
  
  return this.calculateWeightedMedian(prices);
}
```

### Notes (2025-12-02)
- Preços consumidos por `/oracles/price` alimentam enriquecimento de posições em `/defi/blend/positions/:address`.
- Decisão complementar: usar `LOANS_POOL_CONTRACT_ID` e `LOANSPOOL_INTEREST_BPS` (bps → %) via `.env` para `poolId` e `apy` enquanto leitura direta de `params()` do LoansPool via Soroban RPC não está integrada.
- Cache Redis curto (15s) aplicado para reduzir carga e latência.

---

## ADR-003: Passkey Session Keys for UX

**Status**: Accepted  
**Date**: 2025-12-02

### Context

Re-autenticação biométrica a cada operação degrada UX. Usuários esperam flow similar a apps bancários modernos.

### Decision

Implementar Session Keys temporárias após autenticação passkey inicial, permitindo batch operations sem re-prompt.

### Security Model

- Session duration: 1h (configurável)
- Max amount per session: $1000
- Biometric refresh automático para valores altos
- Revoke imediato em caso de suspeita

### Implementation

```typescript
interface SessionKeyConfig {
  duration: number; // 3600s default
  maxAmount: string;
  allowedOperations: ['payment', 'swap', 'manage_offer'];
  biometricRefresh: true;
}
```

---

## ADR-004: 120% Minimum Collateralization

**Status**: Accepted  
**Date**: 2025-12-02

### Context

Stablecoins sub-colateralizadas perdem peg e confiança do mercado (ex: UST collapse).

### Decision

Exigir mínimo de 120% collateralization ratio, com target de 150%.

### Monitoring

- Check a cada 5min
- Alertas em <125%
- Emergency freeze em <120%
- Proof of Reserves publicado on-chain a cada 24h

### Implementation

```typescript
const THRESHOLDS = {
  MIN: 120,      // Emergency freeze
  WARNING: 125,  // Alert admins
  TARGET: 150    // Healthy state
};

if (ratio < THRESHOLDS.MIN) {
  await this.freezeMinting();
  await this.notifyEmergency();
}
```

---

## ADR-005: Progressive Decentralization Strategy

**Status**: Accepted  
**Date**: 2025-12-02

### Context

Lançar diretamente com DAO completo aumenta risco de exploits e dificulta resposta a incidentes.

### Decision

Roadmap de descentralização em 3 fases:

#### Fase 1 (MVP - Mês 1-3)
- Multisig 3/5 para operações críticas
- Timelock 24h para mudanças de parâmetros
- Emergency pause admin-only

#### Fase 2 (Beta - Mês 4-6)
- Multisig 4/7
- Timelock 48h
- Community proposals via forum

#### Fase 3 (DAO v1 - Mês 7-12)
- Token governance (70% community)
- On-chain voting
- Remoção gradual de admin keys

### Security Tradeoffs

**Why NOT fully decentralized desde início**:
- Exploits requerem resposta rápida (ex: PancakeSwap DNS hack)
- Parâmetros iniciais podem precisar ajustes (LTV, taxas)
- Compliance pode exigir intervention (freeze de contas ilícitas)

**Mitigations**:
- Timelock previne rug pulls
- Multisig elimina single point of failure
- Auditoria pública de todas ações admin

---

## ADR-006: Stellar-Only for MVP

**Status**: Accepted  
**Date**: 2025-12-02

### Context

Multi-chain desde início aumenta complexidade e vetores de ataque (bridges vulneráveis).

### Decision

MVP 100% Stellar/Soroban. Cross-chain bridges apenas Fase 2.

### Rationale

| Aspecto | Stellar-Only | Multi-Chain |
|---------|--------------|-------------|
| Tx Cost | $0.00001 | $2+ (Ethereum) |
| Finality | <5s | 12min+ |
| Complexity |  |  |
| Security |  |  (bridge risk) |

**95% dos use cases cobertos**:
- Stablecoin BRL
- Lending/borrowing
- DEX swaps
- PIX integration

---

## ADR-007: KYC Tiered Approach

**Status**: Accepted  
**Date**: 2025-12-02

### Context

KYC completo upfront cria fricção. Usuários querem testar o produto antes de enviar documentos.

### Decision

Sistema de 3 tiers progressivos:

```typescript
const KYC_TIERS = {
  TIER_0: { // Sem KYC
    maxBalance: '1000 BRL',
    maxTxPerDay: '500 BRL',
    features: ['swap', 'yield', 'view']
  },
  
  TIER_1: { // KYC Básico (CPF + selfie)
    maxBalance: '50k BRL',
    maxTxPerDay: '10k BRL',
    features: ['pix', 'lending', 'mint'],
    provider: 'Onfido'
  },
  
  TIER_2: { // KYC Completo (PJ)
    maxBalance: 'Unlimited',
    maxTxPerDay: '500k BRL',
    features: ['all', 'institutional'],
    manualReview: true
  }
};
```

### Compliance

Atende requisitos BACEN e FATF para AML/CTF:
- Monitoring contínuo (Chainalysis)
- Limits progressivos
- Enhanced due diligence para high-value

---

## ADR-008: AI Risk Agent Architecture

**Status**: Accepted  
**Date**: 2025-12-02

### Context

Score de crédito tradicional não captura comportamento DeFi. Precisamos de sistema híbrido on-chain + off-chain com privacidade.

### Decision

Implementar Stellaro (ElizaOS) com ZK-proofs (Groth16).

### Architecture

```
User TX History (on-chain)
        ↓
ZK Proof Generator (off-chain)
        ↓
Groth16 Verifier (Soroban contract)
        ↓
Credit Score (300-850)
        ↓
Lending Decision (automated)
```

### Privacy Model

- TX history nunca exposta (ZK proof)
- Score calculado sem revelar detalhes
- User controla quais dados compartilhar

### Explainability

```typescript
interface AIDecisionLog {
  decision: 'APPROVED' | 'DENIED';
  confidence: number; // 0-100%
  reasoning: string[];
  auditHash: string; // On-chain immutable
}
```

---

## ADR-009: AWS EKS over Self-Managed K8s

**Status**: Accepted  
**Date**: 2025-12-02

### Context

Self-managed Kubernetes exige expertise DevOps e overhead operacional.

### Decision

Usar AWS EKS (Elastic Kubernetes Service) em sa-east-1.

### Cost-Benefit

| Opção | Setup Time | Monthly Cost | Maintenance |
|-------|------------|--------------|-------------|
| EKS | 2 horas | $1500 | Baixo |
| Self-managed | 2 semanas | $800 | Alto |

**Winner**: EKS pela redução de time-to-market e focus no produto.

### Implementation

```yaml
# HPA para auto-scaling 3-20 pods
minReplicas: 3
maxReplicas: 20
targetCPUUtilization: 70%
```

---

## ADR-010: Monorepo com Turborepo

**Status**: Accepted (já implementado)  
**Date**: 2025-12-02

### Context

Múltiplos apps (backend, frontend, contratos) precisam compartilhar código e build cache.

### Decision

Manter estrutura monorepo com Turborepo.

### Benefits

- Shared UI components (`packages/ui`)
- Parallel builds
- Incremental compilation
- Unified dependency management

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    }
  }
}
```

---

## Summary Table

| ADR | Status | Impact | Effort |
|-----|--------|--------|--------|
| 001 - PostgreSQL |  Accepted | CRITICAL | M (1w) |
| 002 - Reflector Oracle |  Accepted | CRITICAL | M (3d) |
| 003 - Session Keys |  Accepted | HIGH | M (1w) |
| 004 - Collateralization |  Accepted | CRITICAL | M (1w) |
| 005 - Progressive Decentral |  Accepted | HIGH | L (2w) |
| 006 - Stellar-Only |  Accepted | MEDIUM | - |
| 007 - KYC Tiers |  Accepted | CRITICAL | L (2w) |
| 008 - AI Risk Agent |  Accepted | HIGH | L (2w) |
| 009 - AWS EKS |  Accepted | HIGH | M (1w) |
| 010 - Monorepo |  Implemented | MEDIUM | - |

---

**Total Implementation Timeline**: 8-10 semanas (com 3 devs)  
**Confiança na Arquitetura**: 75% → 90% após implementação Week 1-2

**Next Review**: Após Week 2 completion
