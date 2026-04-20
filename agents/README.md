# Stellaro Multi-Agent System

Multi-agent system for autonomous DeFi management on Stellar/Soroban.

## Agentes

### 1. Stellaro Agent
**Responsibility:** Risk analysis and proactive mitigation
- Monitors price volatility (via Reflector Oracle)
- Detects liquidity risks in Blend pools
- Recommends mitigation actions (rebalancing, partial liquidation)
- Executes auto-hedging when critical risks are detected

### 2. TreasuryManager Agent
**Responsibility:** Yield optimization and treasury management
- Identifies migration opportunities to higher-APY pools
- Auto-compounding of accumulated yields
- Intelligent rebalancing across pools
- Automated protocol treasury management

### 3. ComplianceBot Agent
**Responsibility:** KYC/AML and regulatory compliance
- Compliance validation on transactions
- Detection of suspicious patterns (structuring, layering, round amounts)
- Enforcement of limits (daily volume, single transaction)
- Blocking disallowed jurisdictions

## Orchestration

The `StellaroAgentOrchestrator` coordinates agents in workflows:

### Workflow 1: Safe Treasury Optimization (Sequential)
```
ComplianceBot → Stellaro → TreasuryManager
```
1. Check address compliance
2. Analyze portfolio risks
3. Optimize yields (only if risks acceptable)

### Workflow 2: Transaction with Compliance (Sequential + Gate)
```
ComplianceBot → [GATE] → Execute → Stellaro
```
1. Validate compliance (block if it fails)
2. Execute transaction (only if approved)
3. Monitor post-transaction risks

### Workflow 3: Monitor & Mitigate (Concurrent)
```
[Stellaro + ComplianceBot] → Auto-Mitigation
```
1. Perform risk analysis and AML in parallel
2. Trigger auto-rebalancing if risks are high

## Installation

 **IMPORTANT:** Microsoft Agent Framework is in preview and requires `--pre` flag

```bash
cd agents
pip install -r requirements.txt --pre
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Configure environment variables:
```env
# GitHub Models (free tier)
GITHUB_TOKEN=ghp_your_token_here
MODEL_ENDPOINT=https://models.inference.ai.azure.com

# Backend Stellaro
BACKEND_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379
```

## Usage

### Run sample orchestrator:
```bash
python orchestrator.py
```

### Use agents individually:
```python
from stellaro_agent import StellaroAgent
from treasury_manager import TreasuryManagerAgent
from compliance_bot import ComplianceBotAgent

# Stellaro
risk_agent = StellaroAgent()
risk_analysis = await risk_agent.analyze_portfolio_risk("GDXLKEY5...")
print(risk_analysis)

# TreasuryManager
treasury_agent = TreasuryManagerAgent()
optimization = await treasury_agent.optimize_treasury_yield("GDXLKEY5...")
print(optimization)

# ComplianceBot
compliance_agent = ComplianceBotAgent()
check = await compliance_agent.check_transaction_compliance(
    user_address="GBRPYHIL...",
    amount_usd=25000,
    asset="USDC"
)
print(check)
```

## Integration with Backend

All agents communicate with the NestJS backend via REST API:

- **Reflector Oracle:** `/oracles/reflector/price/:asset`
- **Blend Protocol:** `/defi/blend/positions/:address`, `/defi/blend/optimal-pool/:asset`, `/defi/blend/rebalance`
- **Compliance:** `/compliance/kyc-status/:address`
- **Memory:** `/memory/history/:address`

## Architecture

```
agents/
├── stellaro_agent.py       # Stellaro Agent (risk)
├── treasury_manager.py     # TreasuryManager Agent
├── compliance_bot.py       # ComplianceBot Agent
├── orchestrator.py         # Multi-Agent Orchestrator
├── requirements.txt        # Dependencies (--pre required)
├── .env.example           # Environment template
└── README.md              # This file
```

## Next Steps

- [ ] Integrate Microsoft Agent Framework for advanced orchestration
- [ ] Add GitHub Models for LLM inference
- [ ] Implement handoff patterns between agents
- [ ] Create agent monitoring dashboard
- [ ] Add unit and E2E tests

## Technical Notes

- **Workflows:** Sequential (compliance gates), Concurrent (risk + AML), Conditional (mitigation triggers)
- **Communication:** REST API calls via `httpx.AsyncClient`
- **Error Handling:** Graceful degradation with fallbacks
- **Observability:** Structured logs in each agent
