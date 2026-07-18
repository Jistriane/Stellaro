# Deployment Guide

This document describes the automated deployment workflows for the Stellaro project.

Official site:

- [stellaro.com.br](https://www.stellaro.com.br/)

## Overview

Stellaro has two main deployment paths:

| Target | Workflow | Trigger | Environment |
| :--- | :--- | :--- | :--- |
| **GitHub Pages** | `github-pages-deploy.yml` | Push to master/main | Static/Documentation |
| **Stellar Testnet** | `deploy-contracts.yml` | Manual (`workflow_dispatch`) or tags | Testing |

## Frontend Deployments

### GitHub Pages Static Export

Pages automatically publishes a static version of the frontend on push to `master` or `main`.

- **Publish mode**: GitHub Actions artifact deployment via `actions/deploy-pages`
- **Preview URL (GitHub Pages)**: `https://jistriane.github.io/Stellaro/`
- **Trigger paths**: `apps/frontend/**`, `packages/ui/**`
- **Manual trigger**: `workflow_dispatch` is enabled

**Setup:**

1. Go to Repository Settings > Pages
2. Select `GitHub Actions` as the source
3. Use the workflow history in GitHub Actions to inspect the latest deployment status

**Local Testing:**

```bash
cd apps/frontend
npm run build:pages
```

Expected output:

- static export in `apps/frontend/out/`

## Smart Contract Deployments

### Testnet Manual Deploy

Deploy contracts to Stellar Testnet with manual approval:

```bash
# Via GitHub UI:
1. Go to Actions > Deploy Contracts to Testnet
2. Click "Run workflow"
3. Confirm deployment key (default: stellaro-testnet-deploy)

# Via GitHub CLI:
gh workflow run deploy-contracts.yml
```

**Or deploy via git tags:**

```bash
git tag deploy-testnet-v1.0.0
git push --tags
```

**Requirements:**

- `SOROBAN_PUBLIC_KEY` - Public key of deployment account
- `SOROBAN_SECRET_KEY` - Secret key (NEVER commit this!)
- `soroban-cli` - Installed automatically by workflow
- Funded deployment account on Stellar Testnet

**Setup:**

1. Create a funded account on Stellar Testnet (get XLM from faucet)
2. Get your public/secret keys
3. Go to Repository Settings > Secrets and variables > Actions
4. Add `SOROBAN_PUBLIC_KEY` and `SOROBAN_SECRET_KEY`

**Deploy Script Details:**

The workflow runs `./deploy-testnet.sh` which:

- Verifies Soroban CLI is installed
- Checks deployment key exists
- Builds all contracts in release mode
- Deploys 8 contracts with testnet parameters
- Updates `.env-testnet` with deployed contract IDs

### Contract Build & Test CI

Contracts are automatically tested on every push/PR:

- **CI Workflow**: `.github/workflows/ci.yml` > `test-contracts` job
- **Tests**: `cargo test --all-features`
- **Linting**: `cargo clippy`
- **Security**: `cargo audit`

## Frontend Testing

The frontend has automated quality checks on every push/PR:

- **Linting**: `npm run lint` (ESLint)
- **Build Check**: `npm run build` (Next.js build validation)
- **Deployment Gates**: Both tests must pass before deployment workflows run

## Manual Workflow Triggers

All workflows can be manually triggered via GitHub CLI or the UI:

```bash
# Frontend tests
gh workflow run frontend-tests.yml

# GitHub Pages deploy
gh workflow run github-pages-deploy.yml

# Contract deployment to testnet
gh workflow run deploy-contracts.yml

# List all workflows
gh workflow list
```

## Deployment Status & Logs

View workflow runs:

```bash
# Latest runs for a workflow
gh run list --workflow=github-pages-deploy.yml -L 5

# Detailed output for a specific run
gh run view <run-id> --log

# Watch a workflow in real-time
gh run watch <run-id>
```

## Environment Variables

Key environment variables used in deployments:

- `DEPLOY_TARGET=github-pages` - Enables static export in Next.js (Pages only)
- `GITHUB_REPOSITORY` - Set by GitHub Actions, used for basePath
- `NEXT_PUBLIC_BASE_PATH` - Frontend base path for Pages

## Security Best Practices

1. **Never commit secrets** - All keys/tokens go in GitHub Secrets only
2. **Rotate secrets** - Periodically update deployment keys and Soroban keys
3. **Limit scope** - Use minimal permissions (deployment keys, key accounts)
4. **Audit deployments** - Check GitHub Actions logs for unauthorized runs
5. **Require reviews** - Consider requiring approvals before manual contract deploys

## Troubleshooting

### Pages deployment shows 404

- Check GitHub Pages settings: Repository > Settings > Pages
- Ensure source is set to "GitHub Actions"
- View build logs: Actions > Deploy to GitHub Pages

### Contract deployment fails

- Ensure account has sufficient XLM balance on testnet
- Check public/secret keys are valid
- Verify `soroban-cli` version: `soroban --version` (>= 23 recommended)
- Check deployment key: `soroban keys show stellaro-testnet-deploy`

### Build fails with `node_modules not found`

- Clear npm cache: `npm cache clean --force`
- Reinstall dependencies from the repository root: `npm ci`
- Check lockfile: `package-lock.json` should be committed

## Related Files

- Frontend build config: `apps/frontend/next.config.mjs`
- Contract deployment script: `./deploy-testnet.sh`
- GitHub Actions: `.github/workflows/*.yml`
- Environment configs: `.env-dev`, `.env-testnet`
