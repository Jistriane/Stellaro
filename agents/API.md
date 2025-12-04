# Stellaro Multi-Agent API

API HTTP para integração dos agents Python (Stellaro, Treasury Manager, Compliance Bot) com o backend NestJS.

## Iniciando o Servidor

```bash
# Instalar dependências
cd agents
pip install -r requirements.txt

# Iniciar servidor FastAPI
python api_server.py

# Ou com variáveis de ambiente
API_HOST=0.0.0.0 API_PORT=8000 python api_server.py
```

O servidor estará disponível em `http://localhost:8000` com documentação interativa em `http://localhost:8000/docs`.

## Endpoints

### Health Check

```http
GET /health
```

Retorna status do serviço e agents ativos.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "agents": {
    "stellaro": "active",
    "treasury_manager": "active",
    "compliance_bot": "active"
  }
}
```

### Trigger Agent Action

```http
POST /agent/action
```

Executa uma ação específica em um agent.

**Request Body:**
```json
{
  "agent": "stellaro",
  "action": "analyze_risk",
  "payload": {
    "user_address": "GC..."
  }
}
```

**Agents e Actions disponíveis:**

- **stellaro**:
  - `analyze_risk` - Analisa riscos do portfólio
  - `execute_mitigation` - Executa mitigação de riscos

- **treasury_manager**:
  - `optimize_yield` - Otimiza yields do treasury
  - `auto_compound` - Auto-compound de yields

- **compliance_bot**:
  - `check_compliance` - Verifica compliance de transação
  - `monitor_aml` - Monitora padrões AML

**Response:**
```json
{
  "success": true,
  "agent": "stellaro",
  "action": "analyze_risk",
  "result": {
    "risks_detected": 2,
    "risks": [...],
    "recommendation": "..."
  }
}
```

### Orchestrate Workflow

```http
POST /orchestrate/workflow
```

Executa workflows multi-agent complexos.

**Request Body (Safe Optimization):**
```json
{
  "workflow": "safe_optimization",
  "payload": {
    "treasury_address": "GC..."
  }
}
```

**Request Body (Transaction Compliance):**
```json
{
  "workflow": "transaction_compliance",
  "payload": {
    "user_address": "GB...",
    "amount_usd": 5000,
    "asset": "USDC",
    "destination": "GD..." // optional
  }
}
```

**Request Body (Monitor & Mitigate):**
```json
{
  "workflow": "monitor_mitigate",
  "payload": {
    "user_address": "GA..."
  }
}
```

**Workflows disponíveis:**

1. **safe_optimization** - Compliance → Risk Analysis → Yield Optimization
2. **transaction_compliance** - Compliance Gate → Execute → Risk Monitoring
3. **monitor_mitigate** - Concurrent Risk & AML → Auto-mitigation

**Response:**
```json
{
  "success": true,
  "workflow": "safe_optimization",
  "result": {
    "treasury_address": "GC...",
    "compliance": {...},
    "risk_analysis": {...},
    "optimization": {...},
    "summary": {
      "total_gain_potential": 5000,
      "compounds_executed": 3
    }
  }
}
```

### Convenience Endpoints

Atalhos para workflows comuns:

```http
POST /treasury/optimize?treasury_address=GC...
POST /transaction/check?user_address=GB...&amount_usd=1000&asset=USDC
POST /risk/monitor?user_address=GA...
```

## Integração com Backend NestJS

O `ElizaService` no backend faz requisições HTTP para o servidor de agents:

```typescript
// apps/backend/src/eliza/eliza.service.ts

// Trigger agent action
await elizaService.triggerAgentAction('stellaro', 'analyze_risk', {
  user_address: 'GC...'
});

// Orchestrate workflow
await elizaService.orchestrateWorkflow('safe_optimization', {
  treasury_address: 'GD...'
});
```

### Variável de Ambiente

Configure a URL do serviço de agents no `.env`:

```bash
# Backend .env
AGENT_SERVICE_URL=http://localhost:8000
```

### Modo Desenvolvimento (Fallback)

Se o serviço de agents não estiver disponível e `NODE_ENV=development`, o ElizaService usa respostas mock automaticamente.

## Testes

```bash
# Testar health check
curl http://localhost:8000/health

# Testar agent action
curl -X POST http://localhost:8000/agent/action \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "stellaro",
    "action": "analyze_risk",
    "payload": {"user_address": "GC..."}
  }'

# Testar workflow
curl -X POST http://localhost:8000/orchestrate/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "safe_optimization",
    "payload": {"treasury_address": "GD..."}
  }'
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY agents/ .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000
CMD ["python", "api_server.py"]
```

### Docker Compose

```yaml
services:
  agents-api:
    build: ./agents
    ports:
      - "8000:8000"
    environment:
      - API_HOST=0.0.0.0
      - API_PORT=8000
    restart: always
```

### Kubernetes

Ver `infra/k8s/agents-deployment.yaml` para configuração completa.

## Monitoring

O servidor expõe métricas no formato FastAPI padrão. Recomenda-se adicionar:

- **Prometheus**: Métricas de requisições, latência, erros
- **Loki**: Logs estruturados
- **Jaeger**: Distributed tracing

## Segurança

Para produção, adicionar:

1. **Autenticação**: JWT tokens ou API keys
2. **Rate limiting**: Proteção contra abuso
3. **CORS**: Configurar origens permitidas
4. **HTTPS**: TLS/SSL obrigatório
5. **Input validation**: Pydantic models já validam, mas adicionar sanitização

```python
# Exemplo de autenticação
from fastapi.security import HTTPBearer

security = HTTPBearer()

@app.post("/agent/action", dependencies=[Depends(security)])
async def trigger_agent_action(...):
    ...
```
