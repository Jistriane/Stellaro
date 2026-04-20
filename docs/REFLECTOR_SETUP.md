# Guia de Setup - Reflector Network

**Última Atualização**: 7 de dezembro de 2025  
**Status**: Production-Ready

## Índice

1. [O que é Reflector Network?](#o-que-é)
2. [Arquitetura](#arquitetura)
3. [Setup Testnet](#setup-testnet)
4. [Setup Produção](#setup-produção)
5. [Integração Backend](#integração-backend)
6. [Integração Frontend](#integração-frontend)
7. [Monitoramento](#monitoramento)
8. [Troubleshooting](#troubleshooting)

---

## O que é Reflector Network?

Reflector Network é um **oracle de preços descentralizado** para Stellar que oferece:

 **Sub-segundo latency** - Preços em tempo real  
 **Multi-source aggregation** - Múltiplas exchange como fonte  
 **ZK-Proofs** - Validação criptográfica de preços  
 **Low cost** - Integrado ao Soroban com taxa mínima  

### Comparação com Alternativas

| Feature | Reflector | Chainlink | Band Protocol |
|---------|-----------|-----------|---------------|
| Latency | <1s | 1-5min | 1-3min |
| Stellar Native |  |  |  |
| Descentralizado |  |  |  |
| Cost (Stellar) | $0.001/update | N/A | N/A |
| ZK Support |  |  |  |

---

## Arquitetura

```
┌────────────────────────────────────┐
│   Reflector Network Validators     │
│  (50+ nodes independentes)         │
└────────┬──────────────────────────┘
         │
    ┌────┴─────┐
    │ Agregação │
    │ de Preços │
    └────┬─────┘
         │
    ┌────▼──────────────────┐
    │  Soroban Contract      │
    │  (Oracle no Stellar)   │
    └────┬──────────────────┘
         │
    ┌────┴──────────────────────────┐
    │   Seu Backend (Stellaro)       │
    │ - Obtem preços via RPC         │
    │ - Cache inteligente            │
    │ - Detecta anomalias            │
    └────────────────────────────────┘
```

---

## Setup Testnet

### Step 1: Verificar Conectividade

```bash
# Testar acesso à Reflector Testnet
curl -s https://api-testnet.reflector.network/api/v1/prices/USDC | jq '.'

# Resposta esperada:
# {
# "asset": "USDC:GCZXWVNJ7F723JHHDV7VWYXPUQR4FNHQHW6ZMCR5I3FQUV4LHVECBHM",
# "price": "1.0",
# "timestamp": 1701944400,
# "sources": ["Binance", "Kraken", "Coinbase"],
# "aggregation_method": "median"
# }
```

### Step 2: Instalar SDK Reflector

```bash
# Node.js/TypeScript
npm install @reflector-network/sdk soroban-client

# Ou via package.json (já incluído em Stellaro)
npm install
```

### Step 3: Configurar Variáveis de Ambiente

```bash
# .env-testnet
cat > .env-testnet << 'EOF'
# Reflector Network
REFLECTOR_URL=https://api-testnet.reflector.network
REFLECTOR_API_KEY=your-api-key-here  # Optional
REFLECTOR_TIMEOUT=5000  # ms

# Stellar Testnet
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# App Config
CACHE_TTL=60000  # 1 minuto
PRICE_DEVIATION_THRESHOLD=500  # 5% (basis points)
LOG_LEVEL=debug
EOF
```

### Step 4: Cliente Reflector (Backend)

```typescript
// backend/src/services/reflector/client.ts
import { Reflector } from '@reflector-network/sdk';

class ReflectorClient {
  private client: Reflector;
  
  constructor() {
    this.client = new Reflector({
      baseUrl: process.env.REFLECTOR_URL,
      timeout: parseInt(process.env.REFLECTOR_TIMEOUT || '5000'),
    });
  }

  async getPrice(asset: string) {
    try {
      const price = await this.client.getPrice({
        baseAsset: asset,
        quoteAsset: 'USD'
      });
      
      return {
        symbol: asset,
        price: parseFloat(price.price),
        timestamp: price.timestamp * 1000,
        sources: price.sources,
        confidence: price.confidence
      };
    } catch (error) {
      console.error(`[Reflector] Erro ao obter preço de ${asset}:`, error);
      throw error;
    }
  }
}

export const reflectorClient = new ReflectorClient();
```

### Step 5: Testar Integração

```bash
# Via curl
curl -X GET "http://localhost:3001/api/reflector/prices/USDC" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Resposta esperada:
# {
# "symbol": "USDC",
# "price": 1.0,
# "timestamp": 1701944400000,
# "source": "reflector",
# "confidence": 0.99
# }
```

---

## Setup Produção

### Step 1: Criar Conta Reflector (Premium)

```bash
# Registrar em https://console.reflector.network
# - Email institucional
# - Verificação de 2FA
# - API Key gerada

# Armazenar API Key com segurança
export REFLECTOR_API_KEY="rk_live_xxxxx"
```

### Step 2: Configurar Mainnet

```bash
# .env-production
cat > .env-production << 'EOF'
# Reflector Network - MAINNET
REFLECTOR_URL=https://api.reflector.network
REFLECTOR_API_KEY=${REFLECTOR_API_KEY}
REFLECTOR_TIMEOUT=5000

# Stellar Mainnet
STELLAR_NETWORK=mainnet
STELLAR_RPC_URL=https://soroban-mainnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"

# SLA Configuration
PRICE_UPDATE_FREQUENCY=30s  # Atualizar a cada 30 segundos
PRICE_DEVIATION_ALERT=1000  # 10% desvio = alerta
MAX_STALE_PRICE=300s  # Máximo 5 minutos de preço antigo

# Redundância
FALLBACK_ORACLE_URLS=["https://api2.reflector.network","https://api3.reflector.network"]
CIRCUIT_BREAKER_THRESHOLD=5  # Falhas antes de abrir circuito
CIRCUIT_BREAKER_TIMEOUT=60s

# Logging
LOG_LEVEL=info
LOG_FORMAT=json  # Para agregação
EOF
```

### Step 3: Multi-Source Aggregation

```typescript
// backend/src/services/reflector/aggregator.ts
interface PriceSource {
  name: string;
  url: string;
  weight: number;  // 0-1
}

class PriceAggregator {
  private sources: PriceSource[] = [
    {
      name: 'reflector-primary',
      url: 'https://api.reflector.network',
      weight: 0.5
    },
    {
      name: 'reflector-secondary',
      url: 'https://api2.reflector.network',
      weight: 0.3
    },
    {
      name: 'stellar-dex-fallback',
      url: 'https://horizon.stellar.org',
      weight: 0.2
    }
  ];

  async getAggregatedPrice(asset: string): Promise<{
    price: number;
    confidence: number;
    sources: string[];
  }> {
    // Fetch de todas as fontes em paralelo
    const results = await Promise.allSettled(
      this.sources.map(source => 
        this.fetchFromSource(source, asset)
      )
    );

    // Calcular mediana ponderada
    const validPrices = results
      .filter(r => r.status === 'fulfilled')
      .map((r: any) => r.value);

    const medianPrice = this.calculateWeightedMedian(validPrices);
    
    return {
      price: medianPrice.price,
      confidence: validPrices.length / this.sources.length,
      sources: validPrices.map(p => p.source)
    };
  }

  private calculateWeightedMedian(prices: any[]): any {
    // Implementação de mediana ponderada
    return prices.sort((a, b) => a.price - b.price)[
      Math.floor(prices.length / 2)
    ];
  }
}
```

### Step 4: Circuit Breaker Pattern

```typescript
// backend/src/services/reflector/circuit-breaker.ts
class ReflectorCircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private threshold = 5;
  private timeout = 60000;  // 1 minuto

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker OPEN - fallback to cache');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

### Step 5: Anomaly Detection

```typescript
// backend/src/services/reflector/anomaly-detector.ts
class AnomalyDetector {
  private priceHistory: Map<string, number[]> = new Map();
  private windowSize = 15;  // últimos 15 preços

  recordPrice(asset: string, price: number) {
    if (!this.priceHistory.has(asset)) {
      this.priceHistory.set(asset, []);
    }
    
    const history = this.priceHistory.get(asset)!;
    history.push(price);
    
    // Manter apenas últimos N preços
    if (history.length > this.windowSize) {
      history.shift();
    }
  }

  detectAnomaly(asset: string, currentPrice: number): {
    isAnomaly: boolean;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    zScore: number;
  } {
    const history = this.priceHistory.get(asset) || [];
    
    if (history.length < 5) {
      return { isAnomaly: false, severity: 'LOW', zScore: 0 };
    }

    // Calcular média e desvio padrão
    const mean = history.reduce((a, b) => a + b) / history.length;
    const variance = history.reduce((sq, n) => 
      sq + Math.pow(n - mean, 2)
    , 0) / history.length;
    const stdDev = Math.sqrt(variance);

    // Z-score
    const zScore = Math.abs((currentPrice - mean) / stdDev);

    return {
      isAnomaly: zScore > 2,
      severity: zScore > 4 ? 'CRITICAL' : 
               zScore > 3 ? 'HIGH' :
               zScore > 2 ? 'MEDIUM' : 'LOW',
      zScore
    };
  }
}
```

---

## Integração Backend

### Endpoint REST

```typescript
// backend/src/reflector/reflector.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReflectorService } from './reflector.service';

@Controller('api/reflector')
export class ReflectorController {
  constructor(private reflectorService: ReflectorService) {}

  @Get('prices/:asset')
  async getPrice(
    @Param('asset') asset: string,
    @Query('issuer') issuer?: string
  ) {
    return this.reflectorService.getPrice(asset, issuer);
  }

  @Get('prices')
  async getPrices(@Query('assets') assets: string) {
    return this.reflectorService.getPrices(assets.split(','));
  }

  @Get('anomalies/:asset')
  async checkAnomaly(
    @Param('asset') asset: string,
    @Query('window') window: number = 15
  ) {
    return this.reflectorService.detectAnomaly(asset, window);
  }

  @Get('portfolio/valuation')
  async getPortfolioValuation(@Query('assets') assets: string) {
    const portfolio = new Map(
      assets.split(',').map(a => [a, 1])  // 1 unidade de cada
    );
    return this.reflectorService.getPortfolioValuation(portfolio);
  }
}
```

### NestJS Module

```typescript
// backend/src/reflector/reflector.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReflectorService } from './reflector.service';
import { ReflectorController } from './reflector.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    RedisModule,
  ],
  providers: [ReflectorService],
  controllers: [ReflectorController],
  exports: [ReflectorService],
})
export class ReflectorModule {}
```

---

## Integração Frontend

### Hook React (já implementado)

```typescript
// apps/frontend/src/hooks/useReflectorPrices.ts
export function useReflectorPrices(assets: string[]) {
  const [prices, setPrices] = useState<Map<string, ReflectorPrice>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      const response = await fetch(
        `${API_URL}/api/reflector/prices?assets=${assets.join(',')}`
      );
      const data = await response.json();
      setPrices(new Map(Object.entries(data)));
      setLoading(false);
    };

    fetchPrices();
  }, [assets]);

  return { prices, loading };
}
```

### Componente Dashboard

```tsx
// apps/frontend/src/components/PriceTicker.tsx
export function PriceTicker({ assets }: { assets: string[] }) {
  const { prices, loading } = useReflectorPrices(assets);

  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from(prices.entries()).map(([asset, data]) => (
        <div key={asset} className="bg-card p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">{asset}</p>
          <p className="text-2xl font-bold">
            ${data.price.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(data.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

## Monitoramento

### Métricas Prometheus

```yaml
# prometheus/stellaro-reflector.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'reflector-api'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    
    # Exemplos de métricas:
    # reflector_price_fetch_duration_seconds
    # reflector_price_fetch_errors_total
    # reflector_cache_hits_total
    # reflector_anomaly_detected_total
    # reflector_circuit_breaker_state
```

### Alerts

```yaml
# prometheus/stellaro-reflector-alerts.yaml
groups:
  - name: reflector_alerts
    rules:
      - alert: ReflectorHighLatency
        expr: reflector_price_fetch_duration_seconds > 1
        for: 5m
        annotations:
          summary: "Reflector latência acima de 1s"

      - alert: ReflectorHighErrorRate
        expr: rate(reflector_price_fetch_errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "Taxa de erro Reflector acima de 5%"

      - alert: ReflectorCircuitBreakerOpen
        expr: reflector_circuit_breaker_state == 1
        for: 1m
        annotations:
          summary: "Circuit breaker Reflector aberto"

      - alert: ReflectorPriceDeviation
        expr: reflector_price_deviation_bps > 1000
        for: 2m
        annotations:
          summary: "Desvio de preço Reflector acima de 10%"
```

---

## Troubleshooting

### Erro: "Connection refused"

```bash
# Verificar conectividade
curl -v https://api.reflector.network/api/v1/prices/USDC

# Se falhar, testar via DNS
nslookup api.reflector.network

# Se DNS falhar, podem ser problemas de rede corporativa
# Solicitar whitelisting de IPs
```

### Erro: "API Key invalid"

```bash
# Verificar se está usando MAINNET com API Key testnet
echo "REFLECTOR_URL: $REFLECTOR_URL"
echo "REFLECTOR_API_KEY: ${REFLECTOR_API_KEY:0:20}..."

# Regenerar API Key em https://console.reflector.network
```

### Cache expirado, preços antigos

```bash
# Verificar TTL de cache
kubectl logs -f pod/backend-xxxxx -n stellaro-prod | grep "Cache TTL"

# Aumentar frequência de atualização
kubectl set env deployment/backend \
  CACHE_TTL=30000 \  # 30 segundos
  -n stellaro-prod
```

### Anomalias falsas

```bash
# Aumentar janela histórica
kubectl set env deployment/backend \
  ANOMALY_WINDOW_SIZE=30 \
  ANOMALY_THRESHOLD=3 \  # 3 desvios padrão
  -n stellaro-prod
```

---

## Checklist de Setup

- [ ] Conta Reflector criada (testnet)
- [ ] API Key gerada e configurada
- [ ] Backend conectando ao Reflector
- [ ] Endpoint `/api/reflector/prices` funcionando
- [ ] Cache Redis funcionando
- [ ] Frontend exibindo preços em tempo real
- [ ] Alertas configurados no Prometheus
- [ ] Tests passando
- [ ] Produção migrada para mainnet
- [ ] Monitoramento ativo em staging

---

## Recursos

- [Reflector Network Docs](https://reflector.network/docs)
- [Stellar Oracles](https://developers.stellar.org/learn/smart-contracts/stellar-data-structures)
- [Exemplos de integração](https://github.com/stellar/stellar-protocol)

