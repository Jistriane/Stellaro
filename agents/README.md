# Stellaro Multi-Agent System

Sistema multi-agente para gestão autônoma de DeFi na rede Stellar/Soroban.

## Agentes

### 1. Stellaro Agent
**Responsabilidade:** Análise de risco e mitigação proativa
- Monitora volatilidade de preços (via Reflector Oracle)
- Detecta riscos de liquidez em pools Blend
- Recomenda ações de mitigação (rebalanceamento, liquidação parcial)
- Executa auto-hedging quando detecta riscos críticos

### 2. TreasuryManager Agent
**Responsabilidade:** Otimização de yield e gestão de tesouraria
- Identifica oportunidades de migração para pools com maior APY
- Auto-compounding de yields acumulados
- Rebalanceamento inteligente entre pools
- Gestão automatizada da tesouraria do protocolo

### 3. ComplianceBot Agent
**Responsabilidade:** KYC/AML e conformidade regulatória
- Validação de compliance em transações
- Detecção de padrões suspeitos (structuring, layering, round amounts)
- Enforcement de limites (volume diário, transação única)
- Bloqueio de jurisdições não permitidas

## Orquestração

O `StellaroAgentOrchestrator` coordena os agentes em workflows:

### Workflow 1: Safe Treasury Optimization (Sequential)
```
ComplianceBot → Stellaro → TreasuryManager
```
1. Verifica compliance do endereço
2. Analisa riscos do portfolio
3. Otimiza yields (somente se riscos aceitáveis)

### Workflow 2: Transaction with Compliance (Sequential + Gate)
```
ComplianceBot → [GATE] → Execute → Stellaro
```
1. Valida compliance (bloqueia se falhar)
2. Executa transação (apenas se aprovada)
3. Monitora riscos pós-transação

### Workflow 3: Monitor & Mitigate (Concurrent)
```
[Stellaro + ComplianceBot] → Auto-Mitigation
```
1. Executa análise de risco e AML em paralelo
2. Trigger auto-rebalancing se riscos altos

## Instalação

⚠️ **IMPORTANTE:** Microsoft Agent Framework está em preview e requer flag `--pre`

```bash
cd agents
pip install -r requirements.txt --pre
```

## Configuração

1. Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure variáveis de ambiente:
```env
# GitHub Models (free tier)
GITHUB_TOKEN=ghp_your_token_here
MODEL_ENDPOINT=https://models.inference.ai.azure.com

# Backend Stellaro
BACKEND_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379
```

## Uso

### Executar orquestrador de exemplo:
```bash
python orchestrator.py
```

### Usar agentes individualmente:
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

## Integração com Backend

Todos os agentes se comunicam com o backend NestJS via REST API:

- **Reflector Oracle:** `/oracles/reflector/price/:asset`
- **Blend Protocol:** `/defi/blend/positions/:address`, `/defi/blend/optimal-pool/:asset`, `/defi/blend/rebalance`
- **Compliance:** `/compliance/kyc-status/:address`
- **Memory:** `/memory/history/:address`

## Arquitetura

```
agents/
├── stellaro_agent.py       # Stellaro Agent (risk)
├── treasury_manager.py     # TreasuryManager Agent
├── compliance_bot.py       # ComplianceBot Agent
├── orchestrator.py         # Multi-Agent Orchestrator
├── requirements.txt        # Dependencies (--pre required)
├── .env.example           # Environment template
└── README.md              # Este arquivo
```

## Próximos Passos

- [ ] Integrar Microsoft Agent Framework para orquestração avançada
- [ ] Adicionar GitHub Models para inferência LLM
- [ ] Implementar handoff patterns entre agentes
- [ ] Criar dashboard de monitoramento de agentes
- [ ] Adicionar testes unitários e E2E

## Notas Técnicas

- **Workflows:** Sequential (compliance gates), Concurrent (risk + AML), Conditional (mitigation triggers)
- **Communication:** REST API calls via `httpx.AsyncClient`
- **Error Handling:** Graceful degradation com fallbacks
- **Observability:** Logs estruturados em cada agente
