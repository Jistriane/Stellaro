# Stellaro — Start Here

Site oficial: [stellaro.com.br](https://www.stellaro.com.br/)

## Status

- Rede: Stellar mainnet (Public Global Stellar Network ; September 2015)
- Registro de deploy (gerado por script e ignorado por git): `mainnet_deployment_registry.json`
- Evidência de deploy/validação (snapshot): [MAINNET_DEPLOYMENT_RESULT.md](MAINNET_DEPLOYMENT_RESULT.md)

## Leitura Recomendada por Perfil

### Executivo / Decisor (10–15 min)

1. [MAINNET_DEPLOYMENT_RESULT.md](MAINNET_DEPLOYMENT_RESULT.md)
2. [MAINNET_CHECKLIST_COMPLETE.md](MAINNET_CHECKLIST_COMPLETE.md)
3. [POST_LAUNCH_OPERATIONS.md](POST_LAUNCH_OPERATIONS.md)

### Tech Lead / Arquiteto (30–60 min)

1. [STELLARO ARQUITETURA TÉCNICA COMPLETA.md](STELLARO%20ARQUITETURA%20T%C3%89CNICA%20COMPLETA.md)
2. [ADRs.md](ADRs.md)
3. [ANALYSIS_SUMMARY_FINAL.md](ANALYSIS_SUMMARY_FINAL.md)
4. [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

### DevOps / Operações (30–60 min)

1. [MAINNET_ONBOARDING_GUIDE.md](MAINNET_ONBOARDING_GUIDE.md)
2. [KUBERNETES_DEPLOY.md](KUBERNETES_DEPLOY.md)
3. [QUICK_DEPLOY_GUIDE.md](QUICK_DEPLOY_GUIDE.md)
4. [CONTRACT_DEPLOYMENT_GUIDE.md](CONTRACT_DEPLOYMENT_GUIDE.md)
5. [SMART_CONTRACT_DEPLOYMENT_REGISTRY.md](SMART_CONTRACT_DEPLOYMENT_REGISTRY.md)
6. [LOCAL_DEV_MODES.md](LOCAL_DEV_MODES.md)
7. [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)

### Desenvolvedores (contracts/backend/web)

1. [SMART_CONTRACT_API_REFERENCE.md](SMART_CONTRACT_API_REFERENCE.md)
2. [BACKEND_INTEGRATION_POINTS.md](BACKEND_INTEGRATION_POINTS.md)
3. [TESTING.md](TESTING.md)
4. [E2E_TESTING.md](E2E_TESTING.md)
5. [LOCAL_DEV_MODES.md](LOCAL_DEV_MODES.md)

### Suporte / Troubleshooting

1. [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)

## Baseline Operacional (Local Development)

- Entre sempre pela raiz do monorepo: `Stellaro/`
- Fluxo padrão recomendado:
  - `npm install`
  - `npm run doctor:local-dev`
  - `npm run dev:stack`
- Fluxo opcional para chain local:
  - `npm run doctor:local-chain`
  - `npm run dev:stack:local-chain`
- Guia oficial do ambiente local: [LOCAL_DEV_MODES.md](LOCAL_DEV_MODES.md)
- Guia resumido de setup: [DEV_ENVIRONMENT_SETUP.md](DEV_ENVIRONMENT_SETUP.md)

## Baseline Operacional (Mainnet)

- Antes de qualquer mudança de mainnet, rode o preflight local: `tools/preflight_mainnet.sh`
- IDs atuais de contratos mainnet:
  - Snapshot humano: [MAINNET_CHECKLIST_COMPLETE.md](MAINNET_CHECKLIST_COMPLETE.md)
  - Registro detalhado: [SMART_CONTRACT_DEPLOYMENT_REGISTRY.md](SMART_CONTRACT_DEPLOYMENT_REGISTRY.md)

## Última Atualização

- 2026-07-18
