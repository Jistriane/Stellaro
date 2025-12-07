# 📘 Guia de Deploy Kubernetes - Stellaro

**Última Atualização**: 7 de dezembro de 2025

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Estrutura de Deployment](#estrutura)
3. [Instalação Passo a Passo](#instalação)
4. [Configuração de Ambiente](#configuração)
5. [Monitoramento e Logs](#monitoramento)
6. [Troubleshooting](#troubleshooting)
7. [Rollback e Recuperação](#rollback)

---

## Pré-requisitos

### Ferramentas Necessárias

```bash
# Verificar versões
kubectl version --client --output=yaml
docker --version
helm version

# Requisitos mínimos:
# - Kubernetes v1.25+
# - Docker 20.10+
# - kubectl 1.25+
# - Helm 3.0+ (opcional, facilitador)
```

### Cluster Kubernetes

```bash
# Opção 1: Local (Minikube)
minikube start --cpus=4 --memory=8192

# Opção 2: Cloud (EKS - AWS)
aws eks create-cluster \
  --name stellaro-prod \
  --version 1.27 \
  --role-arn arn:aws:iam::ACCOUNT:role/eks-service-role \
  --resources-vpc-config subnetIds=subnet-xxxxx

# Opção 3: DigitalOcean Kubernetes (DOKS)
doctl kubernetes cluster create stellaro-prod \
  --region nyc3 \
  --node-pool name=worker-pool;size=s-2vcpu-4gb;count=3
```

### Configurar kubeconfig

```bash
# Para EKS
aws eks update-kubeconfig --region us-east-1 --name stellaro-prod

# Para DOKS
doctl kubernetes cluster kubeconfig save stellaro-prod

# Testar conexão
kubectl cluster-info
kubectl get nodes
```

---

## Estrutura de Deployment

### Arquitetura no K8s

```
┌─────────────────────────────────────────┐
│          Ingress Controller             │
│         (HTTPS + Certificados)          │
└────────────┬────────────────────────────┘
             │
    ┌────────┴─────────┬──────────────┐
    │                  │              │
┌───▼─────┐    ┌──────▼────┐   ┌────▼──────┐
│ Frontend │    │  Backend  │   │ ElizaOS   │
│   Pod    │    │    Pod    │   │  Agent    │
│ (React)  │    │ (NestJS)  │   │  (Node)   │
└──────────┘    └───────────┘   └───────────┘
    │                  │              │
    └────────┬─────────┴──────────────┘
             │
    ┌────────▼──────────────┐
    │   PostgreSQL Service  │
    │   Redis Service       │
    │   Prometheus Metrics  │
    └───────────────────────┘
```

### Namespaces

```bash
# Criar namespaces
kubectl create namespace stellaro-prod
kubectl create namespace stellaro-staging
kubectl create namespace monitoring

# Labels padrão
kubectl label namespace stellaro-prod app=stellaro
```

---

## Instalação Passo a Passo

### Step 1: Preparar Docker Images

```bash
# Clone do repositório
git clone https://github.com/jistriane/Stellaro.git
cd Stellaro

# Build de imagens
docker build -t stellaro/frontend:latest apps/frontend/
docker build -t stellaro/backend:latest apps/backend/
docker build -t stellaro/agents:latest agents-ts/

# Push para registro (Docker Hub, ECR, etc)
docker tag stellaro/backend:latest your-registry/stellaro/backend:v1.0.0
docker push your-registry/stellaro/backend:v1.0.0
```

### Step 2: Criar ConfigMaps e Secrets

```bash
# ConfigMap para variáveis públicas
kubectl create configmap stellaro-config \
  --from-literal=STELLAR_NETWORK=testnet \
  --from-literal=SOROBAN_RPC_URL=https://soroban-testnet.stellar.org \
  --from-literal=REFLECTOR_URL=https://api.reflector.network \
  -n stellaro-prod

# Secret para variáveis sensíveis
kubectl create secret generic stellaro-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@postgres:5432/stellaro" \
  --from-literal=REDIS_URL="redis://redis:6379" \
  --from-literal=STELLAR_SECRET_KEY="SBXXXXXXXX..." \
  --from-literal=JWT_SECRET="your-secret-key" \
  -n stellaro-prod

# Verificar
kubectl get configmap -n stellaro-prod
kubectl get secrets -n stellaro-prod
```

### Step 3: Deploy Database (PostgreSQL)

```yaml
# File: k8s/postgres-deployment.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: stellaro-prod
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: stellaro-prod
spec:
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_USER
          value: stellaro
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: stellaro-secrets
              key: POSTGRES_PASSWORD
        - name: POSTGRES_DB
          value: stellaro_db
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: stellaro-prod
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

```bash
# Deploy
kubectl apply -f k8s/postgres-deployment.yaml

# Verificar
kubectl get pvc,pod -n stellaro-prod
kubectl logs -f deployment/postgres -n stellaro-prod

# Executar migrations
kubectl exec -it deployment/postgres -n stellaro-prod -- \
  psql -U stellaro -d stellaro_db -c "\dt"
```

### Step 4: Deploy Redis

```yaml
# File: k8s/redis-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: stellaro-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: stellaro-prod
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
```

```bash
kubectl apply -f k8s/redis-deployment.yaml
```

### Step 5: Deploy Backend

```yaml
# File: k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: stellaro-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/stellaro/backend:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        envFrom:
        - configMapRef:
            name: stellaro-config
        - secretRef:
            name: stellaro-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - backend
              topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: stellaro-prod
spec:
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 3001
  type: LoadBalancer
```

```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl get deployment,svc -n stellaro-prod
```

### Step 6: Deploy Frontend

```yaml
# File: k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: stellaro-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/stellaro/frontend:v1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.stellaro.com"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: stellaro-prod
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Step 7: Ingress Controller

```yaml
# File: k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: stellaro-ingress
  namespace: stellaro-prod
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - stellaro.com
    - api.stellaro.com
    secretName: stellaro-tls
  rules:
  - host: stellaro.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  - host: api.stellaro.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 80
```

```bash
# Instalar Nginx Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# Deploy Ingress
kubectl apply -f k8s/ingress.yaml
```

---

## Configuração de Ambiente

### Variáveis por Environment

```bash
# Development
kubectl set env deployment/backend \
  NODE_ENV=development \
  LOG_LEVEL=debug \
  -n stellaro-dev

# Production
kubectl set env deployment/backend \
  NODE_ENV=production \
  LOG_LEVEL=error \
  -n stellaro-prod
```

### Secrets Management

```bash
# Usando External Secrets (recomendado)
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets
  namespace: stellaro-prod
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: stellaro-secrets
  namespace: stellaro-prod
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets
    kind: SecretStore
  target:
    name: stellaro-secrets
    creationPolicy: Owner
  data:
  - secretKey: database_url
    remoteRef:
      key: stellaro/db-url
EOF
```

---

## Monitoramento e Logs

### Prometheus & Grafana

```bash
# Instalar stack de monitoramento
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace

# Acessar Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Login: admin / prom-operator
```

### Logs Centralizados

```bash
# Instalar Loki + Promtail
helm install loki grafana/loki-stack \
  -n monitoring \
  --set promtail.enabled=true

# View logs
kubectl logs -f deployment/backend -n stellaro-prod
```

### Health Checks

```bash
# Verificar saúde
kubectl get pods -n stellaro-prod
kubectl describe pod backend-xxxxx -n stellaro-prod

# Acessar logs
kubectl logs -f pod/backend-xxxxx -n stellaro-prod --tail=50
```

---

## Troubleshooting

### Pod não inicia

```bash
# Verificar logs
kubectl logs pod/backend-xxxxx -n stellaro-prod --previous

# Describir pod para eventos
kubectl describe pod/backend-xxxxx -n stellaro-prod

# Acesso ao container (debug)
kubectl debug pod/backend-xxxxx -it -n stellaro-prod
```

### Problemas de Conectividade

```bash
# Testar DNS
kubectl run -it --rm debug --image=busybox -n stellaro-prod -- \
  nslookup postgres

# Testar conectividade ao database
kubectl run -it --rm psql --image=postgres:15-alpine -n stellaro-prod -- \
  psql -h postgres -U stellaro -d stellaro_db -c "SELECT version();"
```

### Problemas de Recurso

```bash
# Verificar uso de recursos
kubectl top nodes
kubectl top pods -n stellaro-prod

# Aumentar limits
kubectl set resources deployment backend \
  --limits=cpu=2,memory=2Gi \
  --requests=cpu=500m,memory=512Mi \
  -n stellaro-prod
```

---

## Rollback e Recuperação

### Rollback de Deployment

```bash
# Ver histórico
kubectl rollout history deployment/backend -n stellaro-prod

# Rollback para versão anterior
kubectl rollout undo deployment/backend -n stellaro-prod

# Rollback para versão específica
kubectl rollout undo deployment/backend --to-revision=2 -n stellaro-prod
```

### Backup e Restauração

```bash
# Backup do PVC
kubectl get pvc -n stellaro-prod
kubectl exec postgres -n stellaro-prod -- \
  pg_dump -U stellaro stellaro_db > backup.sql

# Restaurar
kubectl exec -i postgres -n stellaro-prod -- \
  psql -U stellaro stellaro_db < backup.sql
```

---

## Checklist de Deploy

- [ ] Cluster K8s criado e configurado
- [ ] Namespaces criados
- [ ] ConfigMaps e Secrets configurados
- [ ] PostgreSQL deployado e funcionando
- [ ] Redis deployado
- [ ] Backend deployado (3 replicas)
- [ ] Frontend deployado (2 replicas)
- [ ] Ingress configurado com TLS
- [ ] Monitoramento (Prometheus/Grafana) ativo
- [ ] Logs centralizados funcionando
- [ ] Health checks passando
- [ ] Load tests bem-sucedidos (1000+ RPS)

---

## Recursos Adicionais

- [Kubernetes Documentation](https://kubernetes.io/docs)
- [Helm Charts](https://helm.sh)
- [Stellar + K8s Best Practices](https://developers.stellar.org)

