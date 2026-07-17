# Local Development Modes

## Objetivo

Este guia define a fonte de verdade para executar o ambiente local do Stellaro sem ambiguidade entre chain pública de testnet e chain local.

## Resumo Executivo

- Modo padrão recomendado: `public-testnet`
- Modo opcional para integração local: `local-chain`
- Fonte única da chain local: `stellar/quickstart:testing`
- Porta oficial da chain local: `http://localhost:8000`
- Soroban RPC local oficial: `http://localhost:8000/rpc`

## Quando usar cada modo

### Modo `public-testnet`

Use este modo para desenvolvimento diário, demos internas e fluxos normais de frontend, backend e mobile.

Vantagens:

- Menor risco operacional
- Menor tempo de bootstrap
- Não depende de infraestrutura chain local adicional

Trade-off:

- Leituras e integrações chain usam endpoints públicos de testnet

### Modo `local-chain`

Use este modo apenas quando for necessário validar integração contra Horizon e Soroban RPC locais.

Vantagens:

- Ambiente mais controlado para troubleshooting
- Validação de integração local sem depender da disponibilidade pública da testnet

Trade-off:

- Boot mais lento
- Mais moving parts
- Exige Docker

## Topologia oficial

### Topologia `public-testnet`

- Frontend local
- Backend local
- Mobile local
- Horizon público de testnet
- Soroban RPC público de testnet

### Topologia `local-chain`

- Frontend local
- Backend local
- Mobile local
- `quickstart` local expondo:
  - Horizon em `http://localhost:8000`
  - Soroban RPC em `http://localhost:8000/rpc`

## Comandos oficiais

### Pré-requisitos

- Node.js LTS
- npm 10+
- Docker e Docker Compose

### Instalação

No diretório raiz do monorepo:

```bash
cd /home/jistriane/Stellaro/Stellaro
npm install
```

### Modo padrão: `public-testnet`

Atalho recomendado no root:

```bash
npm run dev:stack
```

Preflight explícito opcional:

```bash
npm run preflight:local-dev
```

Status explícito opcional:

```bash
npm run status:local-dev
```

Fluxo equivalente explícito:

```bash
docker compose up -d postgres redis prometheus grafana
docker compose up -d backend frontend
```

Suba o mobile em terminal dedicado:

```bash
npm run dev:mobile
```

Alternativa para subir apenas o mobile:

```bash
cd apps/mobile
npm run dev
```

### Modo opcional: `local-chain`

Atalho recomendado no root:

```bash
npm run dev:stack:local-chain
```

Preflight explícito opcional:

```bash
npm run preflight:local-chain
```

Status explícito opcional:

```bash
npm run status:local-chain
```

Fluxo equivalente explícito:

```bash
docker compose --profile local-chain up -d quickstart
CHAIN_PROVIDER_MODE=local \
NEXT_PUBLIC_CHAIN_PROVIDER_MODE=local \
docker compose up -d backend frontend
```

Suba o mobile em terminal dedicado com modo local no Expo:

```bash
npm run dev:mobile:local-chain
```

Fluxo equivalente explícito:

```bash
cd apps/mobile
CHAIN_PROVIDER_MODE=local \
HORIZON_URL=http://localhost:8000 \
BACKEND_API_URL=http://localhost:3001 \
npm run dev
```

## Links locais

### Aplicação

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- Swagger: `http://localhost:3001/docs`
- Backend health: `http://localhost:3001/health`
- Mobile Web: `http://localhost:8083`

### Observabilidade

- Grafana: `http://localhost:3003`
- Prometheus: `http://localhost:9090`

### Chain local

- Horizon local: `http://localhost:8000`
- Horizon health: `http://localhost:8000/health`
- Soroban RPC local: `http://localhost:8000/rpc`

## Variáveis de ambiente relevantes

### Backend

- `CHAIN_PROVIDER_MODE=public-testnet|local`
- `STELLAR_NETWORK=testnet|public`
- `STELLAR_HORIZON`
- `SOROBAN_RPC_URL`

### Frontend

- `NEXT_PUBLIC_CHAIN_PROVIDER_MODE=public-testnet|local`
- `NEXT_PUBLIC_STELLAR_NETWORK=testnet|public`
- `NEXT_PUBLIC_HORIZON_URL`
- `NEXT_PUBLIC_SOROBAN_RPC_URL`

### Mobile

- `CHAIN_PROVIDER_MODE=public-testnet|local`
- `STELLAR_NETWORK=testnet|public`
- `HORIZON_URL`
- `STELLAR_NETWORK_PASSPHRASE`
- `BACKEND_API_URL`

## Regras de operação

- `public-testnet` é o default oficial do projeto para desenvolvimento normal.
- `local-chain` existe para validação específica de integração.
- Use `npm run dev:stack` e `npm run dev:stack:local-chain` como interface operacional preferencial.
- Os atalhos de stack executam preflight de portas antes do `docker compose`.
- Use `npm run status:local-dev` e `npm run status:local-chain` para consolidar processos, containers e URLs ativas.
- Não suba paralelamente outra stack local de Horizon/Soroban fora do `quickstart`.
- Se a porta `8000` estiver ocupada, trate isso como conflito de infraestrutura e não como bug de aplicação.

## Troubleshooting rápido

### Verificar serviços Docker

```bash
docker compose ps
docker compose --profile local-chain ps
```

### Rodar preflight manual

```bash
npm run preflight:local-dev
npm run preflight:local-chain
```

### Rodar status manual

```bash
npm run status:local-dev
npm run status:local-chain
```

### Validar chain local

```bash
curl -i http://localhost:8000/health
curl -i -X POST http://localhost:8000/rpc \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

### Reiniciar frontend

```bash
cd apps/frontend
npm run dev
```

### Reiniciar backend

```bash
cd apps/backend
npm run dev
```

## Decisão arquitetural

Esta estratégia responde melhor às quatro perguntas do arquiteto:

1. Atende o objetivo de negócio porque mantém o fluxo de desenvolvimento previsível.
2. Respeita restrições técnicas ao reduzir custo operacional no modo padrão.
3. Melhora confiabilidade e manutenibilidade ao eliminar topologias locais concorrentes.
4. Usa a opção menos arriscada: testnet pública por padrão e chain local apenas quando necessária.
