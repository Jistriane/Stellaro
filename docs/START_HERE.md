# STELLARO PROJECT - START HERE

## Status Summary

- Project Completion: 100%
- Testnet Strict Validation: 100%
- Documentation Cleanup: aligned to v4 baseline

Progress bars:

- Overall Project: [####################] 100%
- Strict Testnet Evidence: [####################] 100%
- Documentation Standardization: [####################] 100%

## Recommended Reading By Role

### Executive / Decision Maker (15 min)

1. [EXECUTIVE_SUMMARY_CONTINUATION.md](TESTING_SUMMARY.md)
2. [RELEASE_READINESS_TESTNET_20260420.md](RELEASE_READINESS_TESTNET_20260420.md)

### Technical Lead / Architect (45-60 min)

1. [CONTINUATION_PLAN_APRIL_2026.md](CONTINUATION_PLAN_APRIL_2026.md)
2. [ANALYSIS_SUMMARY_FINAL.md](ANALYSIS_SUMMARY_FINAL.md)
3. [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

### DevOps / Operations (45-90 min)

1. [ACTION_GUIDE_NEXT_STEPS.md](ACTION_GUIDE_NEXT_STEPS.md)
2. [MAINNET_CHECKLIST_COMPLETE.md](MAINNET_CHECKLIST_COMPLETE.md)
3. [QUICK_DEPLOY_GUIDE.md](QUICK_DEPLOY_GUIDE.md)
4. [CONTRACT_DEPLOYMENT_GUIDE.md](CONTRACT_DEPLOYMENT_GUIDE.md)
5. [SMART_CONTRACT_DEPLOYMENT_REGISTRY.md](SMART_CONTRACT_DEPLOYMENT_REGISTRY.md)
6. [POST_LAUNCH_OPERATIONS.md](POST_LAUNCH_OPERATIONS.md)

### Developers (contracts/backend)

1. [WEEK1_BATCH_EXECUTOR_TASKS.md](../contracts/INTEGRATION_TASKS.md)
2. [WEEK2_MEV_GUARD_TASKS.md](../contracts/INTEGRATION_TASKS.md)
3. [SMART_CONTRACT_API_REFERENCE.md](SMART_CONTRACT_API_REFERENCE.md)
4. [BACKEND_INTEGRATION_POINTS.md](BACKEND_INTEGRATION_POINTS.md)

### Support / Troubleshooting

1. [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)
2. [TESTING.md](TESTING.md)

## Current Operational Baseline

- Canonical strict evidence bundles:
	- [contracts/reports/20260420_rc_strict/evidence_report.md](../contracts/reports/20260420_rc_strict/evidence_report.md)
	- [contracts/reports/20260425_104952/evidence_report.md](../contracts/reports/20260425_104952/evidence_report.md)
	- [contracts/reports/20260425_104952/evidence_report.json](../contracts/reports/20260425_104952/evidence_report.json)

- Validated contract IDs (latest testnet deploy 2026-05-11):
	- Stablecoin: `CCOOH5HD7QPRLE2M7ENDUS3HFMBFEH6QNUCBTY6W3XV7TKQ2VVOP6DPU`
	  - https://stellar.expert/explorer/testnet/contract/CCOOH5HD7QPRLE2M7ENDUS3HFMBFEH6QNUCBTY6W3XV7TKQ2VVOP6DPU
	- RiskLock: `CAWWAXLYRDVJLNT4KINIK5BOYZSMQZGOJIUYBU2B7CBLQXUM7PG5ZDBX`
	  - https://stellar.expert/explorer/testnet/contract/CAWWAXLYRDVJLNT4KINIK5BOYZSMQZGOJIUYBU2B7CBLQXUM7PG5ZDBX
	- LoansPool: `CBDNBEKIXEKCJPDBSAEBNJ62ZENE4ZJG2EVOTGBYOHJ7SXQ5K6OPUO25`
	  - https://stellar.expert/explorer/testnet/contract/CBDNBEKIXEKCJPDBSAEBNJ62ZENE4ZJG2EVOTGBYOHJ7SXQ5K6OPUO25
	- Portfolio: `CB34KFLFRDTG36NUCW2VBAIGKMM4FVIWK7FL76H6RTSEZZT7PQ2XZPYL`
	  - https://stellar.expert/explorer/testnet/contract/CB34KFLFRDTG36NUCW2VBAIGKMM4FVIWK7FL76H6RTSEZZT7PQ2XZPYL
	- Governance: `CCA6ZOLV2S5AR43VS47KJZSPSV4NGHCPAFQG3DK7UJBOUXIVGGIXQMRO`
	  - https://stellar.expert/explorer/testnet/contract/CCA6ZOLV2S5AR43VS47KJZSPSV4NGHCPAFQG3DK7UJBOUXIVGGIXQMRO
	- ZK Verifier: `CBDBZ4V2A4LBWJ2SGCKLIFTINMTEG626S2NH2DPLHZDDCCHRACID5E7L`
	  - https://stellar.expert/explorer/testnet/contract/CBDBZ4V2A4LBWJ2SGCKLIFTINMTEG626S2NH2DPLHZDDCCHRACID5E7L
	- VC Registry: `CD3IEVYYTYUYPLM7WT335SM4AO7FX4VMWR5DWXEL3D7CFTDT5NPNRV3Z`
	  - https://stellar.expert/explorer/testnet/contract/CD3IEVYYTYUYPLM7WT335SM4AO7FX4VMWR5DWXEL3D7CFTDT5NPNRV3Z
	- Batch Executor: `CATVMEW7IXDGXZ333K3YWOXAHX3FXZ3CTWNRYZQUJTPK2SISTOFXFGP2`
	  - https://stellar.expert/explorer/testnet/contract/CATVMEW7IXDGXZ333K3YWOXAHX3FXZ3CTWNRYZQUJTPK2SISTOFXFGP2
	- MEV Guard: `CCNXG3ZSXVI6X7MTCNYMYCNDP3TH43PQNZUKZHCFAQ72RXSEQNWK6L4J`
	  - https://stellar.expert/explorer/testnet/contract/CCNXG3ZSXVI6X7MTCNYMYCNDP3TH43PQNZUKZHCFAQ72RXSEQNWK6L4J

## Quick Checklist

- [ ] Read role-specific docs above
- [ ] Confirm environment variables for selected network
- [ ] Re-run strict evidence if contracts/flows changed
- [ ] Review release readiness note before deployment decision

## Decision Gate

- If strict evidence remains PASS and no blocking regressions are open, proceed to release-readiness review.
- If strict evidence fails, stop and resolve blockers using [TESTNET_UPGRADE_CHECKLIST.md](TESTNET_UPGRADE_CHECKLIST.md).

## Last Update

- Date: 2026-05-11
- Maintainer scope: documentation index, operational handoff, and v4 launch surfaces
