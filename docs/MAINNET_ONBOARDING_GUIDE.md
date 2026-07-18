# Mainnet Onboarding Guide

Official site: [stellaro.com.br](https://www.stellaro.com.br/)

## Purpose

This guide defines the minimum onboarding flow for engineers and operators working on Stellaro mainnet procedures.

## Access Requirements

- Repository access with write permissions
- Production secrets access through approved secret manager
- Multi-sig operational role approval
- Incident communication channel membership

## Mandatory Preflight

1. Confirm active release version and deployment window.
2. Validate environment variables and network passphrase.
3. Validate contract IDs and API endpoints for mainnet profile:
   - `docs/SMART_CONTRACT_DEPLOYMENT_REGISTRY.md`
   - `mainnet_deployment_registry.json` (generated output; ignored by git)
4. Run smoke checks in read-only mode before any mutation.

## Operational Checklist

- Review current runbook and rollback plan
- Verify monitoring dashboards and alerting thresholds
- Confirm evidence logging path for post-deploy audit
- Confirm emergency pause and response owners

## Post-Onboarding Validation

- Execute approved dry-run commands
- Record validation evidence
- Confirm access to tracing, logs, and health endpoints

## Ownership

Any onboarding change must be reviewed by platform and security owners.
