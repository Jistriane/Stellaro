# Smart Contract Deployment Registry

Version: 2026-05-11
Status: Active (Testnet)

This document is the canonical English registry for smart contract deployment data in this repository, including Contract IDs and Stellar Expert links.

## 1) Latest Automated Testnet Deployment (Confirmed)

Deployment source:
- Script: `infra/deploy_soroban.sh`
- Command: `./infra/deploy_soroban.sh axon-admin`
- Network: Stellar testnet
- Environment files updated by deploy script:
  - `.env-dev`
  - `apps/backend/.env-dev`

Confirmed deployed contracts:

| Contract Module | Env Key | Contract ID | Stellar Expert |
| :--- | :--- | :--- | :--- |
| stablecoin | STABLECOIN_CONTRACT_ID | CCOOH5HD7QPRLE2M7ENDUS3HFMBFEH6QNUCBTY6W3XV7TKQ2VVOP6DPU | https://stellar.expert/explorer/testnet/contract/CCOOH5HD7QPRLE2M7ENDUS3HFMBFEH6QNUCBTY6W3XV7TKQ2VVOP6DPU |
| risklock | RISKLOCK_CONTRACT_ID | CAWWAXLYRDVJLNT4KINIK5BOYZSMQZGOJIUYBU2B7CBLQXUM7PG5ZDBX | https://stellar.expert/explorer/testnet/contract/CAWWAXLYRDVJLNT4KINIK5BOYZSMQZGOJIUYBU2B7CBLQXUM7PG5ZDBX |
| loans_pool | LOANSPOOL_CONTRACT_ID | CBDNBEKIXEKCJPDBSAEBNJ62ZENE4ZJG2EVOTGBYOHJ7SXQ5K6OPUO25 | https://stellar.expert/explorer/testnet/contract/CBDNBEKIXEKCJPDBSAEBNJ62ZENE4ZJG2EVOTGBYOHJ7SXQ5K6OPUO25 |
| portfolio | PORTFOLIO_CONTRACT_ID | CB34KFLFRDTG36NUCW2VBAIGKMM4FVIWK7FL76H6RTSEZZT7PQ2XZPYL | https://stellar.expert/explorer/testnet/contract/CB34KFLFRDTG36NUCW2VBAIGKMM4FVIWK7FL76H6RTSEZZT7PQ2XZPYL |
| governance | GOVERNANCE_CONTRACT_ID | CCA6ZOLV2S5AR43VS47KJZSPSV4NGHCPAFQG3DK7UJBOUXIVGGIXQMRO | https://stellar.expert/explorer/testnet/contract/CCA6ZOLV2S5AR43VS47KJZSPSV4NGHCPAFQG3DK7UJBOUXIVGGIXQMRO |
| zk_verifier | ZK_VERIFIER_CONTRACT_ID | CBDBZ4V2A4LBWJ2SGCKLIFTINMTEG626S2NH2DPLHZDDCCHRACID5E7L | https://stellar.expert/explorer/testnet/contract/CBDBZ4V2A4LBWJ2SGCKLIFTINMTEG626S2NH2DPLHZDDCCHRACID5E7L |
| vc_registry | VC_REGISTRY_ID | CD3IEVYYTYUYPLM7WT335SM4AO7FX4VMWR5DWXEL3D7CFTDT5NPNRV3Z | https://stellar.expert/explorer/testnet/contract/CD3IEVYYTYUYPLM7WT335SM4AO7FX4VMWR5DWXEL3D7CFTDT5NPNRV3Z |
| batch_executor | BATCH_EXECUTOR_CONTRACT_ID | CATVMEW7IXDGXZ333K3YWOXAHX3FXZ3CTWNRYZQUJTPK2SISTOFXFGP2 | https://stellar.expert/explorer/testnet/contract/CATVMEW7IXDGXZ333K3YWOXAHX3FXZ3CTWNRYZQUJTPK2SISTOFXFGP2 |
| mev_guard | MEV_GUARD_CONTRACT_ID | CCNXG3ZSXVI6X7MTCNYMYCNDP3TH43PQNZUKZHCFAQ72RXSEQNWK6L4J | https://stellar.expert/explorer/testnet/contract/CCNXG3ZSXVI6X7MTCNYMYCNDP3TH43PQNZUKZHCFAQ72RXSEQNWK6L4J |

## 2) Additional Operational Testnet Contracts (Historical Manifest)

These modules are referenced as operational in project manifests and documentation.

| Contract Module | Contract ID | Stellar Expert |
| :--- | :--- | :--- |
| recurring_payments | CCD4OHCNA27Z7FUDAA3YSSYCOZE2ZI4ZWSR6QC363LOMWUCFJDNZT7ED | https://stellar.expert/explorer/testnet/contract/CCD4OHCNA27Z7FUDAA3YSSYCOZE2ZI4ZWSR6QC363LOMWUCFJDNZT7ED |
| dao_governance | CDJ7KQDEROW7TH4YYTSHVV7KKMDWMDOBS76UENIP6N4JPYQCD4YR37QW | https://stellar.expert/explorer/testnet/contract/CDJ7KQDEROW7TH4YYTSHVV7KKMDWMDOBS76UENIP6N4JPYQCD4YR37QW |
| institutional_vault | CA2VG7TADA2JQQICK43Q33XYF5T6YMHUTM3CMKKGUJV5HFVTGCNQCWAH | https://stellar.expert/explorer/testnet/contract/CA2VG7TADA2JQQICK43Q33XYF5T6YMHUTM3CMKKGUJV5HFVTGCNQCWAH |
| insurance_pool | CCIX35HUAEROVZR6WI76YB5IPDD3SN4EQFGWFHL4ZSO6FOKNNYJWI6XS | https://stellar.expert/explorer/testnet/contract/CCIX35HUAEROVZR6WI76YB5IPDD3SN4EQFGWFHL4ZSO6FOKNNYJWI6XS |

## 3) Full Contract Module Inventory (Repository)

The repository currently contains the following contract modules:

- batch_executor
- bridge_adapter
- dao_governance
- governance
- institutional_vault
- insurance_pool
- liquid_staking
- loans_pool
- mev_guard
- multisig_adapter
- portfolio
- recurring_payments
- referral_system
- risklock
- rwa_marketplace
- rwa_tokenizer
- stablecoin
- vc_registry
- zk_verifier

Deployment coverage status:
- Confirmed in latest automated deployment (Section 1): 9 modules
- Additional operational IDs from project manifest (Section 2): 4 modules
- Remaining modules do not currently have a public Contract ID recorded in canonical docs.

## 4) Source of Truth

Primary references:
- `docs/CONTRACT_DEPLOYMENT_GUIDE.md`
- `README.md` (Deployment Registry and Explorer Links)
- `.env-dev`
- `apps/backend/.env-dev`

Update policy:
- After each new deployment, update this document first.
- Keep Contract IDs and Stellar Expert links synchronized with `.env-dev` and deployment guide snapshots.
