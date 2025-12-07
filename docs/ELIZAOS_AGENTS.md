# 🤖 Guia de Operação - ElizaOS Agents Stellaro

**Última Atualização**: 7 de dezembro de 2025  
**Status**: Production-Ready

## 📋 Índice

1. [Arquitetura dos Agents](#arquitetura)
2. [Setup e Instalação](#setup)
3. [Configuração de Ambientes](#configuração)
4. [Operação dos Agents](#operação)
5. [Integração com Backend](#integração)
6. [Deploying to Production](#production)
7. [Monitoring & Logs](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Arquitetura

### Agents Stellaro

```
┌────────────────────────────────────┐
│   ElizaOS Runtime Orchestrator     │
└────────┬───────────────────────────┘
         │
    ┌────┴─────┐
    │           │
┌───▼────────┐ ┌──▼────────────┐
│  Risk      │ │  Treasury      │
│  Monitor   │ │  Manager       │
│  (Agent 1) │ │  (Agent 2)     │
└───┬────────┘ └──┬────────────┘
    │             │
    │ WebSocket   │ WebSocket
    │             │
    └──────┬──────┘
           │
    ┌──────▼──────────┐
    │  Backend API    │
    │  (NestJS)       │
    └─────────────────┘
```

### Responsabilidades por Agent

| Agent | Responsabilidade | Acionadores |
|-------|-----------------|------------|
| **Risk Monitor** | Detectar riscos em portfolio | Preço >5%, Colateral <120%, Health < 0 |
| **Treasury Manager** | Rebalancear pool de liquidez | TVL mudança, APY subótima |
| **Compliance Bot** | Verificar AML/KYC | Nova transação > limiar |
| **Orchestrator** | Coordenar agents | Eventos críticos, decisões complexas |

---

## Setup e Instalação

### Step 1: Clonar e Instalar Dependências

```bash
cd /home/jistriane/Documentos/Stellaro/agents-ts

# Instalar Eliza CLI
npm install -g @elizaos/cli

# Instalar dependências locais
npm install

# Compilar TypeScript
npm run build
```

### Step 2: Configurar Variáveis de Ambiente

```bash
# .env (agentes)
cat > .env << 'EOF'
# ElizaOS Core
ELIZA_LOG_LEVEL=debug
ELIZA_PORT=3100
ELIZA_HOST=0.0.0.0

# Stellaro Backend
STELLARO_API_URL=http://localhost:3001
STELLARO_API_KEY=your-api-key-here

# Stellar Network
STELLAR_NETWORK=testnet
STELLAR_SECRET_KEY=SBXXXXXXXX...
STELLAR_ASSET_ISSUER=GBXXXXXXXX...

# External APIs
REFLECTOR_API_URL=https://api-testnet.reflector.network
REFLECTOR_API_KEY=your-reflector-key

# Credentials
TELEGRAM_BOT_TOKEN=your-telegram-token
DISCORD_BOT_TOKEN=your-discord-token
TWITTER_API_KEY=your-twitter-api-key

# Database
AGENT_DB_URL=postgresql://user:pass@localhost:5432/eliza_agents

# Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/HOOK
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_FROM=alerts@stellaro.com
EOF

# .env-testnet (variáveis sensíveis protegidas)
cat > .env-testnet << 'EOF'
# Protegido em kubernetes secrets
STELLAR_SECRET_KEY=***REDACTED***
EOF
```

### Step 3: Criar Agentes

```bash
# Estrutura de projeto
agents-ts/
├── src/
│   ├── characters/
│   │   ├── risk-monitor.ts
│   │   ├── treasury-manager.ts
│   │   └── orchestrator.ts
│   ├── actions/
│   │   ├── analyze-risk.ts
│   │   ├── rebalance-pool.ts
│   │   └── detect-anomaly.ts
│   ├── evaluators/
│   │   ├── market-evaluator.ts
│   │   └── health-evaluator.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── .env
```

### Step 4: Definir Character (Agente)

```typescript
// src/characters/risk-monitor.ts
import {
  Character,
  ModelProviderName,
  Clients,
  defaultCharacterTraits,
} from "@elizaos/core";

export const riskMonitor: Character = {
  name: "Stellaro Risk Monitor",
  username: "stellaro-risk",
  description:
    "AI agent que monitora riscos em tempo real no protocolo Stellaro DeFi",
  
  modelProvider: ModelProviderName.OPENAI,
  modelEndpoint: "https://api.openai.com/v1",
  
  system: "You are Stellaro Risk Monitor, an AI specialized in detecting and alerting about DeFi risks. Analyze portfolio health, detect market anomalies, and recommend protective actions.",
  
  clients: [Clients.TELEGRAM, Clients.DISCORD],
  
  traits: {
    ...defaultCharacterTraits,
    responsiveness: "immediate",
    risk_aversion: "high",
    communication_style: "urgent-when-critical",
  },
  
  knowledge: [
    {
      id: "health-factor-formula",
      content: "Health Factor = Total Collateral / Total Borrowed (must be > 1.2)"
    },
    {
      id: "liquidation-threshold",
      content: "Account at risk if Health Factor < 1.05"
    }
  ]
};
```

### Step 5: Definir Actions (Comportamentos)

```typescript
// src/actions/analyze-risk.ts
import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  parseJsonStringToObject,
} from "@elizaos/core";

export const analyzeRiskAction: Action = {
  name: "ANALYZE_RISK",
  similes: ["CHECK_HEALTH", "DETECT_RISK", "MONITOR_PORTFOLIO"],
  description:
    "Analisa saúde do portfolio e detecta riscos",
  
  validate: async (
    runtime: IAgentRuntime,
    message: Memory
  ): Promise<boolean> => {
    // Validar que mensagem contém dados de portfolio
    return message.content && message.content.includes("portfolio");
  },
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<boolean> => {
    try {
      // Fetch portfolio data
      const portfolio = await fetch(
        `${process.env.STELLARO_API_URL}/api/portfolio/${message.userId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.STELLARO_API_KEY}`,
          }
        }
      ).then(r => r.json());

      // Calcular health factor
      const healthFactor = 
        portfolio.totalCollateral / portfolio.totalBorrowed;

      // Determinar nível de risco
      let riskLevel = "SAFE";
      let recommendation = "No action needed";
      
      if (healthFactor < 1.2) {
        riskLevel = "WARNING";
        recommendation = "Consider adding collateral or reducing borrow";
      }
      
      if (healthFactor < 1.05) {
        riskLevel = "CRITICAL";
        recommendation = "LIQUIDATION IMMINENT - Add collateral NOW";
      }

      // Responder
      const response = {
        riskLevel,
        healthFactor: healthFactor.toFixed(2),
        recommendation,
        timestamp: new Date().toISOString()
      };

      callback(response);
      return true;
    } catch (error) {
      console.error("Error analyzing risk:", error);
      return false;
    }
  },
  
  examples: [
    [
      {
        user: "What's my portfolio health?",
        content: { portfolio: "active" },
      },
      {
        user: "stellaro-risk",
        content: {
          text: "Your health factor is 1.45. All systems green! 🟢"
        }
      }
    ]
  ]
};
```

---

## Configuração de Ambientes

### Testnet (Desenvolvimento)

```bash
# docker-compose-testnet.yml
version: '3.8'

services:
  eliza-risk:
    image: stellaro/agents:latest
    environment:
      NODE_ENV: testnet
      STELLAR_NETWORK: testnet
      ELIZA_LOG_LEVEL: debug
      ELIZA_PORT: 3100
    ports:
      - "3100:3100"
    volumes:
      - ./agents-ts:/app/agents
    networks:
      - stellaro

  eliza-treasury:
    image: stellaro/agents:latest
    environment:
      NODE_ENV: testnet
      AGENT_TYPE: treasury
      ELIZA_PORT: 3101
    ports:
      - "3101:3100"
    networks:
      - stellaro

networks:
  stellaro:
    driver: bridge

# Deploy testnet
docker-compose -f docker-compose-testnet.yml up -d
```

### Produção (Mainnet)

```bash
# kubernetes/agents-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eliza-risk-monitor
  namespace: stellaro-prod
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
  selector:
    matchLabels:
      app: eliza-risk
  template:
    metadata:
      labels:
        app: eliza-risk
    spec:
      containers:
      - name: eliza
        image: your-registry/stellaro/agents:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3100
        env:
        - name: NODE_ENV
          value: "production"
        - name: STELLAR_NETWORK
          value: "mainnet"
        - name: ELIZA_LOG_LEVEL
          value: "info"
        - name: STELLARO_API_URL
          value: "https://api.stellaro.com"
        envFrom:
        - secretRef:
            name: eliza-secrets
        - configMapRef:
            name: eliza-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3100
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## Operação dos Agents

### Iniciar Agents (Desenvolvimento)

```bash
# Terminal 1: Risk Monitor
cd agents-ts
npm run dev:risk

# Esperado:
# [INFO] Risk Monitor initialized
# [INFO] Listening on port 3100
# [INFO] Connected to Stellar testnet
```

### Iniciar Agents (Produção)

```bash
# Via Kubernetes
kubectl apply -f kubernetes/agents-deployment.yaml

# Verificar status
kubectl get pods -n stellaro-prod -l app=eliza-risk
kubectl logs -f deployment/eliza-risk-monitor -n stellaro-prod
```

### Monitorar Agent Status

```bash
# Health check
curl http://localhost:3100/health

# Resposta esperada:
# {
#   "status": "healthy",
#   "uptime": 3600,
#   "memoryUsage": "128MB",
#   "lastAction": "2025-12-07T10:30:00Z"
# }
```

---

## Integração com Backend

### Webhook do Agent para Backend

```typescript
// src/actions/send-alert.ts
export const sendAlertAction: Action = {
  name: "SEND_ALERT",
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<boolean> => {
    // Enviar para backend
    const alert = {
      agentName: "Risk Monitor",
      severity: "HIGH",
      message: "Health factor < 1.2",
      userId: message.userId,
      timestamp: Date.now()
    };

    const response = await fetch(
      `${process.env.STELLARO_API_URL}/api/alerts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.STELLARO_API_KEY}`
        },
        body: JSON.stringify(alert)
      }
    );

    return response.ok;
  }
};
```

### Backend recebe alertas

```typescript
// backend/src/alerts/alerts.controller.ts
@Controller('api/alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Post()
  async createAlert(@Body() alert: CreateAlertDto) {
    // Persistir alerta
    await this.alertsService.create(alert);
    
    // Enviar notificação ao usuário
    await this.notificationService.notify({
      userId: alert.userId,
      title: `Alert from ${alert.agentName}`,
      body: alert.message,
      severity: alert.severity
    });
    
    return { success: true };
  }
}
```

---

## Deploying to Production

### Build Docker Image

```bash
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY agents-ts/package*.json ./
RUN npm install --production

COPY agents-ts/src ./src
COPY agents-ts/tsconfig.json ./

RUN npm run build

EXPOSE 3100

CMD ["node", "dist/index.js"]

# Build & Push
docker build -t your-registry/stellaro/agents:v1.0.0 .
docker push your-registry/stellaro/agents:v1.0.0
```

### Kubernetes Secrets

```bash
# Criar secrets
kubectl create secret generic eliza-secrets \
  --from-literal=STELLAR_SECRET_KEY="SBXXXXXXXX..." \
  --from-literal=STELLARO_API_KEY="sk-xxxxx" \
  --from-literal=TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjk..." \
  -n stellaro-prod

# ConfigMap
kubectl create configmap eliza-config \
  --from-literal=STELLAR_NETWORK=mainnet \
  --from-literal=ELIZA_LOG_LEVEL=info \
  -n stellaro-prod
```

---

## Monitoring & Logs

### Prometheus Metrics

```typescript
// src/utils/metrics.ts
import { register, Counter, Histogram } from 'prom-client';

export const agentActionCounter = new Counter({
  name: 'agent_actions_total',
  help: 'Total agent actions executed',
  labelNames: ['agent', 'action', 'status']
});

export const agentExecutionTime = new Histogram({
  name: 'agent_execution_seconds',
  help: 'Agent action execution time',
  labelNames: ['agent', 'action']
});

// Uso
agentActionCounter.inc({
  agent: 'risk-monitor',
  action: 'analyze-risk',
  status: 'success'
});
```

### Logging Estruturado

```typescript
// src/utils/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.ELIZA_LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Uso
logger.info({
  agent: 'risk-monitor',
  event: 'risk-detected',
  healthFactor: 1.15,
  recommendation: 'add-collateral'
});
```

### Centralizar Logs (Loki)

```bash
# Kubernetes DaemonSet para Promtail
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: promtail
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: promtail
  template:
    metadata:
      labels:
        app: promtail
    spec:
      containers:
      - name: promtail
        image: grafana/promtail:latest
        args:
          - -config.file=/etc/promtail/promtail-config.yaml
        volumeMounts:
        - name: logs
          mountPath: /var/log
      volumes:
      - name: logs
        hostPath:
          path: /var/log
EOF
```

---

## Troubleshooting

### Agent não conecta ao Backend

```bash
# Verificar conectividade
kubectl exec -it pod/eliza-risk-xxxxx -n stellaro-prod -- \
  curl -v http://backend-service:3001/health

# Verificar DNS
kubectl run -it --rm debug --image=busybox -n stellaro-prod -- \
  nslookup backend-service

# Verificar secrets
kubectl get secret eliza-secrets -n stellaro-prod -o yaml
```

### Agent para de responder

```bash
# Verificar logs
kubectl logs -f pod/eliza-risk-xxxxx -n stellaro-prod --tail=100

# Verificar recursos
kubectl top pod eliza-risk-xxxxx -n stellaro-prod

# Reiniciar pod
kubectl delete pod eliza-risk-xxxxx -n stellaro-prod
```

### Memória vazando

```bash
# Aumentar limite
kubectl set resources deployment eliza-risk-monitor \
  --limits=memory=2Gi \
  -n stellaro-prod

# Resetar após X horas (via cron)
kubectl create cronjob eliza-restart --image=bitnami/kubectl \
  --schedule="0 2 * * *" \
  -- rollout restart deployment/eliza-risk-monitor \
  -n stellaro-prod
```

---

## Checklist de Operação

- [ ] Agents instalados e compilados
- [ ] .env configurado (testnet)
- [ ] Backend conectando com sucesso
- [ ] Telegram/Discord integrados
- [ ] Logs estruturados funcionando
- [ ] Prometheus scraping metrics
- [ ] Alertas enviando para Slack
- [ ] Migrado para mainnet
- [ ] Kubernetes deployment testado
- [ ] 24h de monitoramento em produção

---

## Recursos Úteis

- [ElizaOS Docs](https://elizaos.ai)
- [Stellar API](https://developers.stellar.org)
- [Kubernetes Best Practices](https://kubernetes.io/docs)
- [Prometheus Alerting](https://prometheus.io)

