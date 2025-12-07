# ⚡ Quick Start - Mainnet Deployment (English)

**Last Updated**: December 7, 2025  
**Status**: 🟢 Production Ready  
**Deployment Target**: Stellar Mainnet

---

## 🚀 Quick Commands

### 1. Deploy Frontend
```bash
cd apps/frontend
npm install
npm run build
npm run start
# → Access at https://api.stellaro.com
```

### 2. Deploy Backend
```bash
cd apps/backend
npm install
npm run build
npm run prisma:migrate:deploy
npm run start
# → API at https://api.stellaro.com/api
```

### 3. Deploy Contracts
```bash
cd contracts
cargo build --release
cargo test
./deploy-mainnet.sh
# → Verify contract IDs in .env-mainnet
```

### 4. Deploy Infrastructure
```bash
cd infra/k8s
kubectl apply -f namespace.yaml
kubectl apply -f postgresql.yaml
kubectl apply -f redis.yaml
kubectl apply -f backend.yaml
kubectl apply -f frontend.yaml
kubectl apply -f ingress.yaml
# → Wait until all Pods are Running
```

### 5. Verify Deployment
```bash
# Check API health
curl https://api.stellaro.com/health

# Check cache
curl https://api.stellaro.com/api/cache/stats

# Check database
curl https://api.stellaro.com/api/db/status

# Check contracts
curl https://api.stellaro.com/api/contracts/status
```

---

## 📊 Performance Validation

### Load Test (k6)
```bash
k6 run load-tests/k6-scenario.js
# Expected:
# - P95: < 200ms
# - Error rate: < 0.1%
# - Success rate: > 99%
```

### Monitor Metrics
```bash
# Open Grafana
open http://localhost:3000

# View dashboard
# → Stellaro Performance Dashboard
# → P95 latency target: 200ms
# → Cache hit rate: > 85%
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL="postgresql://user:pass@db:5432/stellaro"
REDIS_URL="redis://redis:6379"
STELLAR_NETWORK="MAINNET"
STELLAR_RPC="https://rpc-mainnet.stellar.org"
API_KEY="your-api-key"
JWT_SECRET="your-jwt-secret"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="https://api.stellaro.com/api"
NEXT_PUBLIC_STELLAR_NETWORK="MAINNET"
```

### Kubernetes Secrets
```bash
kubectl create secret generic stellaro-secrets \
  --from-literal=db-password=secure-password \
  --from-literal=redis-password=secure-password \
  --from-literal=jwt-secret=your-jwt-secret \
  -n stellaro-prod
```

---

## 📈 Monitoring

### Grafana Dashboards
```
URL: https://grafana.stellaro.com
User: admin
Password: admin (change immediately)

Dashboards:
1. Stellaro Performance Dashboard
   - API Latency (P50/P95/P99)
   - Cache Hit Rate
   - Error Rate
   - Resource Usage

2. Infrastructure Dashboard
   - Pod status
   - Node metrics
   - Storage usage
   - Network I/O
```

### Prometheus Queries
```bash
# P95 Latency
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Cache Hit Rate
cache_hit_rate * 100

# Error Rate
rate(http_request_errors_total[5m]) * 100

# Memory Usage
process_resident_memory_bytes / 1024 / 1024
```

### Alerts
```yaml
# Critical Alerts (PagerDuty)
- API down (HTTP 5xx > 5%)
- Latency spike (P95 > 500ms)
- Cache miss rate too high (< 80%)
- Memory > 90%
- Database slow queries

# Warning Alerts
- High error rate (> 1%)
- Memory > 80%
- CPU > 70%
```

---

## 🔐 Security Checklist

### Pre-Deployment
- [ ] Change Grafana default password
- [ ] Rotate all API keys
- [ ] Verify TLS certificates
- [ ] Check CORS policies
- [ ] Validate rate limits
- [ ] Review database permissions
- [ ] Enable audit logging
- [ ] Setup security headers

### Post-Deployment
- [ ] Verify HTTPS only
- [ ] Check security headers (curl -I)
- [ ] Test rate limiting
- [ ] Validate CORS behavior
- [ ] Check authentication tokens
- [ ] Monitor for anomalies
- [ ] Review access logs

---

## 🆘 Troubleshooting

### API Not Responding
```bash
# Check Pod status
kubectl get pods -n stellaro-prod

# Check logs
kubectl logs -n stellaro-prod backend-xxxx

# Check service
kubectl get svc -n stellaro-prod

# Restart if needed
kubectl rollout restart deployment/backend -n stellaro-prod
```

### Database Connection Failed
```bash
# Check PostgreSQL Pod
kubectl get pods -n stellaro-prod -l app=postgresql

# Check database logs
kubectl logs -n stellaro-prod postgresql-0

# Verify credentials
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Cache Not Working
```bash
# Check Redis Pod
kubectl get pods -n stellaro-prod -l app=redis

# Check Redis connection
redis-cli -h redis.stellaro-prod.svc.cluster.local PING
# Expected: PONG

# Check cache stats
curl https://api.stellaro.com/api/cache/stats
```

### High Latency
```bash
# Check cache hit rate
curl https://api.stellaro.com/api/cache/stats | jq .hitRate

# Check slow queries
# (See PERFORMANCE_GUIDE.md section 4.2)

# Check network latency
kubectl top pods -n stellaro-prod

# Scale up if needed
kubectl scale deployment/backend --replicas=5 -n stellaro-prod
```

---

## 📋 Deployment Checklist

### Pre-Deployment (T-24h)
- [ ] All tests passing
- [ ] Code review complete
- [ ] Security scan clean
- [ ] Performance baseline set
- [ ] Monitoring alerts configured
- [ ] Backup strategy verified
- [ ] Team notified

### Deployment Day (T-0h)
- [ ] Health check all services
- [ ] Verify database migration
- [ ] Test API endpoints
- [ ] Start streaming logs
- [ ] Activate on-call rotation
- [ ] Deploy frontend
- [ ] Deploy backend
- [ ] Deploy contracts

### Post-Deployment (T+1h)
- [ ] Monitor P95 latency
- [ ] Check error rate
- [ ] Verify cache hit rate
- [ ] Monitor resource usage
- [ ] Review user feedback
- [ ] Document any issues

### Verification (T+24h)
- [ ] Data integrity check
- [ ] Transaction verification
- [ ] Performance analysis
- [ ] Security review
- [ ] Publish deployment report

---

## 📞 Emergency Contacts

| Situation | Action | Contact |
|-----------|--------|---------|
| API Down | Page On-Call | PagerDuty |
| Database Down | Activate DR | DBA Team |
| Security Incident | Activate Incident Response | Security Lead |
| Performance Degradation | Scale up | DevOps Lead |
| Data Loss | Restore from backup | Database Lead |

---

## 📚 Documentation Links

- 📖 [Kubernetes Deployment](./docs/KUBERNETES_DEPLOY.md)
- 🌐 [Reflector Setup](./docs/REFLECTOR_SETUP.md)
- ⚡ [Performance Guide](./docs/PERFORMANCE_GUIDE.md)
- ✅ [Mainnet Checklist](./MAINNET_CHECKLIST.md)
- 📊 [Session Summary](./SESSION_COMPLETION_SUMMARY.md)

---

## 🎯 Success Criteria

### Performance
- [ ] P95 latency < 200ms
- [ ] Cache hit rate > 85%
- [ ] Error rate < 0.1%
- [ ] Uptime > 99.9%

### Reliability
- [ ] Zero data loss
- [ ] All transactions verified
- [ ] No security incidents
- [ ] Smooth user experience

### Operations
- [ ] Monitoring working
- [ ] Alerts triggering correctly
- [ ] Backup running
- [ ] Team confident

---

**Status**: 🟢 READY TO DEPLOY

**Next Action**: Run deployment script when mainnet funding confirmed
