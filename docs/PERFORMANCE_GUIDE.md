# Performance Optimization Guide - Stellaro

**Última Atualização**: 7 de dezembro de 2025  
**Target**: Sub-1s página load, 99.9% uptime, <100ms latência API

## Métricas de Referência

| Métrica | Target | Atual | Status |
|---------|--------|-------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | TBD |  |
| **FID** (First Input Delay) | < 100ms | TBD |  |
| **CLS** (Cumulative Layout Shift) | < 0.1 | TBD |  |
| **TTL** (Time To Live) | < 3s | TBD |  |
| **API Latency P95** | < 100ms | TBD |  |
| **Cache Hit Rate** | > 80% | TBD |  |

---

## 1. Frontend Optimization

### 1.1 Code Splitting & Lazy Loading

```typescript
//  BOM: Import dinâmico com suspense
import dynamic from 'next/dynamic';

const DashboardChart = dynamic(
  () => import('@/components/Chart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Carregar apenas no client
  }
);

export function Dashboard() {
  return (
    <Suspense fallback={<Skeleton />}>
      <DashboardChart />
    </Suspense>
  );
}
```

### 1.2 Image Optimization

```typescript
//  BOM: Next.js Image component
import Image from 'next/image';

export function Hero() {
  return (
    <Image
      src="/hero.webp"
      alt="Hero"
      width={1920}
      height={1080}
      priority // Carregar com prioridade
      placeholder="blur" // Blur while loading
      quality={85} // 85% qualidade (imperceptível)
    />
  );
}
```

### 1.3 Bundle Size Analysis

```bash
# Analisar bundle
npm install --save-dev @next/bundle-analyzer

# .env
ANALYZE=true npm run build

# Targets:
# - Main bundle: < 200KB gzipped
# - Vendor: < 150KB
# - Cada página: < 100KB
```

### 1.4 Web Vitals Monitoring

```typescript
// pages/_app.tsx
import { useReportWebVitals } from 'next/web-vitals';

function MyApp({ Component, pageProps }) {
  useReportWebVitals((metric) => {
    // Enviar para analytics
    const body = JSON.stringify(metric);
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/web-vitals', body);
    } else {
      fetch('/api/analytics/web-vitals', { body, method: 'POST' });
    }
  });

  return <Component {...pageProps} />;
}
```

---

## 2. Backend Optimization

### 2.1 Redis Caching Strategy

```typescript
//  Implementado: Multi-layer cache
// apps/backend/src/cache/cache.service.ts

// Uso em controller
@Controller('api/dashboard')
export class DashboardController {
  constructor(private cache: CacheService) {}

  @Get('metrics')
  async getMetrics() {
    return this.cache.remember(
      'dashboard:metrics',
      300, // 5 min cache
      () => this.expensiveMetricsCalculation()
    );
  }
}
```

### 2.2 Database Query Optimization

```typescript
//  Implementado: Query optimization service
// apps/backend/src/database/optimization.service.ts

// Exemplo: Eager loading com Prisma
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    portfolio: { // Evita N+1 queries
      select: { assetCode: true, quantity: true },
      take: 10,
    },
  },
});
```

### 2.3 Connection Pooling

```typescript
// schema.prisma
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
  
  // Connection pooling
  pool {
    connection_limit = 20
    timeout = 5
    idle_in_transaction_timeout = 10
  }
}

// Environment variables
DATABASE_URL="postgresql://user:pass@host:5432/stellaro?schema=public&sslmode=require&pool_size=20&max_overflow=10"
```

### 2.4 Rate Limiting

```typescript
//  BOM: Rate limiter middleware
import { RateLimit } from 'express-rate-limit';

const limiter = new RateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // máx 100 requisições por IP
  message: 'Muitas requisições, tente novamente mais tarde',
  standardHeaders: true, // Retornar info no `RateLimit-*` headers
  legacyHeaders: false, // Desabilitar `X-RateLimit-*` headers
});

app.use('/api/', limiter);

// Rate limit específico para login (mais restritivo)
const loginLimiter = new RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máx 5 tentativas
  skipSuccessfulRequests: true, // Não contar requisições bem-sucedidas
});

@Post('auth/login')
@UseGuards(new RateLimitGuard(loginLimiter))
async login(@Body() dto: LoginDto) {
  // ...
}
```

### 2.5 Compression Middleware

```typescript
//  BOM: Gzip compression
import compression from 'compression';

app.use(compression({
  threshold: 1024, // Comprimir se > 1KB
  level: 6, // Nível de compressão (1-9)
  filter: (req, res) => {
    // Não comprimir se já está comprimido
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));
```

---

## 3. CDN & Static Assets

### 3.1 CloudFront Configuration

```bash
# AWS CloudFront setup
# 1. Criar distribuição CloudFront
# 2. Origem: S3 ou Next.js API
# 3. Cache behaviors:

# Pattern: /static/*
# TTL: 1 ano (365 dias)
# Compress: Sim
# Versioning: xyz-hash.js (forever cache)

# Pattern: /images/*
# TTL: 30 dias
# Compress: Sim
# Formatos: WebP, AVIF

# Pattern: /
# TTL: 1 dia
# Compress: Sim
# Invalidar ao deploy
```

### 3.2 Versionamento de Assets

```typescript
//  BOM: Hash automático
// Next.js com webpack gera automatically:
// - static/abc123def456.js (hash do conteúdo)
// - stylesheet/xyz789.css

// Resultado:
// - Browsers podem cachear forever
// - Arquivo muda = novo hash = novo download
// - Sem invalidação manual de CDN
```

---

## 4. Database Optimization

### 4.1 Índices Estratégicos

```sql
--  Implementado: optimization.service.ts

-- Índice simples para WHERE clauses
CREATE INDEX idx_users_email ON users(email);

-- Índice composto para queries comuns
CREATE INDEX idx_transactions_user_date 
  ON transactions(user_id, created_at DESC);

-- Full-text search
CREATE INDEX idx_transactions_fts 
  ON transactions USING GIN(
    to_tsvector('english', description)
  );
```

### 4.2 Query Monitoring

```bash
# Habilitar PostgreSQL query logging
# postgresql.conf
log_statement = 'all'
log_duration = true
log_min_duration_statement = 1000  # Log queries > 1s

# Analisar com pg_stat_statements
CREATE EXTENSION pg_stat_statements;

SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100  -- queries > 100ms
ORDER BY mean_time DESC;
```

---

## 5. API Performance

### 5.1 Response Time Targets

```
GET /api/prices/{asset}
├─ Cache hit: < 5ms (L1 memory)
├─ Cache hit: < 50ms (L2 Redis)
└─ Cache miss: < 200ms (fetch + cache)

POST /api/transactions
├─ Validation: < 10ms
├─ Business logic: < 50ms
├─ Database: < 100ms
└─ Total: < 200ms

GET /api/dashboard
├─ Parallel queries: < 500ms
├─ Caching layer: < 100ms (cached)
└─ Total: < 600ms
```

### 5.2 Parallel Requests

```typescript
//  BOM: Executar em paralelo
async function getDashboard(userId: string) {
  // Evitar Promise.all() se uma falhar todas falham
  // Usar Promise.allSettled() para resiliência
  
  const results = await Promise.allSettled([
    this.portfolioService.get(userId),
    this.analyticsService.getMetrics(userId),
    this.priceService.getPrices(['USDC', 'XLM', 'BTC']),
  ]);

  return {
    portfolio: results[0].status === 'fulfilled' ? results[0].value : null,
    metrics: results[1].status === 'fulfilled' ? results[1].value : null,
    prices: results[2].status === 'fulfilled' ? results[2].value : null,
  };
}
```

---

## 6. Monitoring & Profiling

### 6.1 Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['localhost:3001']
    
    # Métricas de interesse:
    metrics_path: '/metrics'
```

### 6.2 Key Metrics to Monitor

```
# Response Time (P50, P95, P99)
http_request_duration_seconds

# Cache Hit Rate
cache_hit_rate

# Database Query Time
db_query_duration_seconds

# Memory Usage
process_resident_memory_bytes

# Error Rate
http_request_errors_total

# Active Connections
http_requests_active
```

### 6.3 Profiling em Produção

```bash
# Node.js profiling
node --prof app.js

# Análise
node --prof-process isolate-*.log > profile.txt

# Usar 0x para UI
npx 0x node app.js
```

---

## 7. Deployment & Scaling

### 7.1 Horizontal Scaling

```yaml
# kubernetes/backend-autoscaling.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: stellaro-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 7.2 Load Testing

```bash
# Apache Bench
ab -n 10000 -c 100 https://api.stellaro.com/api/prices/USDC

# k6 (mais realista)
k6 run load-test.js

# Gatling (script completo)
# scenarios: ramp-up, sustain, spike, stress
```

---

## Checklist de Implementação

### Frontend
- [ ] Code splitting automático
- [ ] Lazy loading de images
- [ ] Web Vitals monitoring
- [ ] Bundle size < 200KB
- [ ] CloudFront CDN configurado

### Backend
- [ ] Redis L1/L2 cache
- [ ] Database indices otimizados
- [ ] Connection pooling ativo
- [ ] Rate limiting implementado
- [ ] Compression middleware

### Database
- [ ] Índices nas 10 queries mais comuns
- [ ] Query monitoring ativo
- [ ] Archive de dados antigos
- [ ] Backup automático
- [ ] pg_stat_statements habilitado

### Infrastructure
- [ ] CDN (CloudFront/Cloudflare)
- [ ] Kubernetes HPA configurado
- [ ] Monitoring (Prometheus)
- [ ] Load testing (k6/Gatling)
- [ ] Alert thresholds definidos

### Produção
- [ ] P95 latência < 100ms
- [ ] Cache hit rate > 80%
- [ ] Error rate < 0.1%
- [ ] Uptime > 99.9%
- [ ] Load sustain 1000+ RPS

---

## Load Testing Commands

```bash
# Simples (Apache Bench)
ab -n 10000 -c 100 https://api.stellaro.com/api/prices/USDC

# Com k6
k6 run --vus 100 --duration 30s load-test.js

# Com wrk (muito rápido)
wrk -t4 -c100 -d30s https://api.stellaro.com/api/prices/USDC

# Com Gatling
mvn gatling:test
```

---

## Otimizações Rápidas (High ROI)

1. **Ativar Redis** (2-5x mais rápido)
2. **Adicionar índices BD** (10-100x mais rápido)
3. **Comprimir responses** (70% redução tamanho)
4. **CDN para assets** (sub-50ms de latência)
5. **HTTP/2 push** (paralelizar downloads)

---

## Recursos

- [WebPageTest](https://webpagetest.org) - Análise de performance
- [Chrome DevTools](https://developer.chrome.com/docs/devtools) - Profiling
- [k6](https://k6.io) - Load testing
- [Redis Best Practices](https://redis.io/topics/faq)

