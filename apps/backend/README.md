
---

### Multi-Agent Orchestration Endpoints (ElizaOS)

#### Trigger Individual Agents

**POST /eliza/agents/risk-analysis/:address**
Trigger Stellaro to analyze user portfolio

```json
Response:
{
  "agent": "stellaro",
  "action": "analyze_portfolio",
  "timestamp": "2025-02-12T18:00:00Z",
  "result": {
    "success": true,
    "message": "stellaro.analyze_portfolio executed successfully",
    "payload": { "userAddress": "GDXLKEY5..." }
  }
}
```

**POST /eliza/agents/treasury-optimize/:address**
Trigger TreasuryManager yield optimization

**POST /eliza/agents/compliance-check**
Trigger ComplianceBot transaction compliance check

```json
Request:
{
  "userAddress": "GBRPYHIL...",
  "amountUSD": 25000,
  "asset": "USDC",
  "destination": "GDXLKEY5..." // optional
}
```

#### Orchestrate Multi-Agent Workflows

**POST /eliza/agents/orchestrate/safe-optimization**
Sequential workflow: Compliance → Risk → Optimization

```json
Request:
{
  "treasuryAddress": "GDXLKEY5..."
}

Response:
{
  "success": true,
  "workflow": "safe_optimization",
  "treasury_address": "GDXLKEY5...",
  "steps": {
    "compliance": { "approved": true },
    "risk": { "risks_detected": 0 },
    "optimization": { "estimated_annual_gain": 5000 }
  },
  "summary": { "total_gain_potential": 5000 }
}
```

**POST /eliza/agents/orchestrate/transaction-compliance**
Sequential workflow with gate: Compliance → Execute → Risk Monitoring

```json
Request:
{
  "userAddress": "GBRPYHIL...",
  "amountUSD": 10000,
  "asset": "USDC",
  "destination": "GDXLKEY5..."
}
```

**GET /eliza/agents/monitor/:address**
Concurrent monitoring (Risk + AML) with auto-mitigation

```json
Response:
{
  "success": true,
  "workflow": "monitor_mitigate",
  "user_address": "GBRPYHIL...",
  "steps": {
    "risk": { "risks_detected": 1 },
    "aml": { "patterns_detected": 0 }
  },
  "mitigation_triggered": false
}
```
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
## Redis (optional)

To enable cache/publish features, configure `REDIS_URL` and install the dependency:

```bash
cd apps/backend
npm install ioredis
# optional: run Redis locally
docker run -d --name redis -p 6379:6379 redis:7
```

The backend falls back to in-memory when `REDIS_URL` is not set.

### Observability endpoints

- `GET /redis/health` — status e contadores básicos:
  - `connected`, `hits`, `misses`, `memoryItems`, `rateLimitedTotal`, `zkVerifyOk`, `zkVerifyErr`, `zkScoreOk`, `zkScoreErr`
- `GET /redis/metrics` — métricas em formato Prometheus:
  - `redis_connected`, `redis_cache_hits_total`, `redis_cache_misses_total`
  - `zk_rate_limited_total`, `zk_verify_ok_total`, `zk_verify_err_total`, `zk_score_ok_total`, `zk_score_err_total`

### Reflector Oracle endpoints

- `GET /oracles/price/:asset` — real-time price with <500ms latency
- `GET /oracles/anomaly/:asset?window=15` — detect price anomalies (pump/dump)
- `GET /oracles/aggregated?assets=XLM,USDC` — multi-source price aggregation

### Blend Protocol DeFi endpoints

- `POST /defi/blend/auto-compound` — auto-compound rewards and re-deposit
  ```json
  { "userAddress": "G..." }
  ```
- `GET /defi/blend/optimal-pool/:asset` — find best pool by APY/risk score
- `POST /defi/blend/rebalance` — rebalance portfolio across pools
  ```json
  {
    "userAddress": "G...",
    "targetAllocation": { "XLM": 60, "USDC": 40 }
  }
  ```

### ZK Verification endpoints

- `POST /zk/verify` — verify Groth16 ZK-proof with rate limiting
- `GET /zk/score/:address` — get cached credit score (5min TTL)

```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# unit tests with coverage
$ npm run test:cov

# e2e tests (9 suites, 46 tests)
$ npm run test:e2e

# e2e with open handles detection
$ npm run test:e2e:detect

# e2e with coverage
$ npm run test:e2e:cov

# all tests with coverage (unit + e2e)
$ npm run test:all
```

### Test Infrastructure

**Unit Tests (36% coverage)**:
- 23 suites, 231 tests passing
- Services: Actions, Auth, Chain, Soroban, Compliance, Redis, Passkey, Oracles, Notifications, Pix, ZK, Defi, Risk, Governance, Wallets, Webhooks, Eliza, Security
- Controllers: Wallets, Actions, Auth, Governance

**E2E Tests (100% passing)**:
- 9 suites, 46 tests
- Isolated from external dependencies (Postgres, Redis, Soroban)
- Centralized mocks/stubs in `test/test-utils.ts`
- PIX in stub mode, ZK without RPC
- Runtime: ~7s in serial mode
- Suites: auth, auth-flow, actions-flow, pix, positions, reserves, oracles, zk, app

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Stellaro Backend Additions

### Chain & On-Chain Data

- `GET /chain/health` — verifica integração com Horizon/Soroban
- `GET /memory/history/:address?limit=20&cursor=<id>` — histórico on-chain via Horizon (paginação por cursor)

### Oracles

- `GET /oracles/price?asset=XLM&quote=USD` — preço em tempo real
- `GET /oracles/aggregated?assets=XLM,USDC` — agregação multi-fonte

### Blend Protocol DeFi

- `GET /defi/blend/positions/:address` — posições reais agregadas (Horizon + enriquecimento via LoansPool)
  - Resposta: `{ address, positions: [{ asset, balance, valueUSD, apy?, poolId? }], totalUSD }`
- Enriquecimento:
  - `poolId` de `LOANS_POOL_CONTRACT_ID`
  - `apy` de `LOANSPOOL_INTEREST_BPS` (bps). Ex.: `1500` → `15.00`
  - Cache de 15s em Redis quando disponível

### Env vars úteis

- `SOROBAN_RPC_URL`, `HORIZON_URL`
- `LOANS_POOL_CONTRACT_ID`, `LOANSPOOL_INTEREST_BPS`
- `BACKEND_URL`/`BACKEND_PUBLIC_URL`

### Quick test

```bash
curl -s http://localhost:3001/chain/health
curl -s 'http://localhost:3001/oracles/price?asset=XLM&quote=USD'
curl -s 'http://localhost:3001/memory/history/<address>?limit=10'
curl -s 'http://localhost:3001/defi/blend/positions/<address>'
```
