# Stellaro DeFi Credit Infrastructure on Stellar

Official site:

- https://www.stellaro.com.br/

![Stellaro Logo](https://raw.githubusercontent.com/Jistriane/Stellaro/main/stellaro-logo.png)

<p align="center">
	<img src="https://raw.githubusercontent.com/Jistriane/Stellaro/main/Stellaro-Capa.png" alt="Stellaro Hero Banner" style="width:100%; max-width:1200px; height:auto;" />
</p>

<p align="center">
	<img src="https://raw.githubusercontent.com/Jistriane/Stellaro/main/Home.png" alt="Stellaro Home Preview" style="width:100%; max-width:1200px; height:auto;" />
</p>

## DeFi Credit Infrastructure on Stellar

Welcome to the Stellaro project. This monorepo contains the complete architecture for a DeFi credit infrastructure platform built on Stellar, featuring a Next.js 16 frontend, NestJS backend, AI-powered risk management (ElizaOS), and enterprise-grade integrations for Stellar/Soroban, PIX, Cards, KYC, and Passkeys.

Frontend deployment (GitHub Pages):

- https://jistriane.github.io/Stellaro/

Frontend deployment (Render):

- https://stellaro-frontend-qh1a.onrender.com/

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose

### Install and Run

```bash
npm install
docker compose up -d postgres redis

cd apps/backend && npm run dev
cd apps/frontend && npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

### Core Health Checks

```bash
curl -s http://localhost:3001/health
curl -s http://localhost:3001/payments/x402/status
curl -s http://localhost:3001/payments/etherfuse/status
```

## Frontend Runtime

- The frontend runs with English as the default runtime locale.
- `next-intl` is configured with a single `en` locale in the current app shell.
- UI copy in the main routes is kept in English to match the runtime configuration.

### TradingView in Development

- By default, local development uses a safe fallback card instead of loading the external TradingView widget.
- This avoids noisy third-party preload/script warnings in dev consoles and automated browser checks.
- To force-enable the real TradingView widget in development, set `NEXT_PUBLIC_ENABLE_TRADINGVIEW_DEV=true` in your local env.
- The variable is documented in [.env.example](.env.example).

## Monorepo Structure

- `apps/frontend`: Next.js web app (primary user experience)
- `apps/backend`: NestJS API gateway and orchestration layer
- `contracts`: Soroban smart contracts and deployment scripts
- `docs`: canonical documentation in English
- `agents`: Python agent services and automations
- `infra`: infrastructure configuration and deployment assets

## x402 Live Activation (Backend + Frontend)

The base x402 integration is available in the payments module and exposed in the Pix screen.

### 1. Required backend environment variables

Set the following variables in `apps/backend/.env`:

```env
# x402 mode: disabled | stub | live
X402_MODE=live

# Facilitator endpoint
X402_FACILITATOR_URL=https://your-facilitator.example.com

# Contract/provider used by the facilitator for settlement
FACILITATOR_PROVIDER_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# API key expected by the facilitator
FACILITATOR_API_KEY=replace-with-real-key

# Optional tuning
X402_NETWORK=stellar:testnet
X402_ACCEPTED_ASSET=STLT
X402_RESOURCE=/payments/x402/settle
X402_RECIPIENT=GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
X402_FEE_BPS=25
X402_TTL_SECONDS=900
```

### 2. Frontend API URL

Set in `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Run local services

```bash
docker compose up -d postgres redis
```

Then start backend and frontend in separate terminals:

```bash
cd apps/backend && npm run dev
cd apps/frontend && npm run dev
```

### 4. Verify integration

Status endpoint:

```bash
curl -s http://localhost:3001/payments/x402/status
```

Sample quote:

```bash
curl -s -X POST http://localhost:3001/payments/x402/quote \
	-H 'Content-Type: application/json' \
	-d '{"amount":"25.00","asset":"STLT","intent":"deposit","memo":"stellaro:deposit"}'
```

Expected behavior:

- `mode=stub` when live credentials are incomplete.
- `mode=live` when all facilitator credentials are configured.
- Pix page shows **x402 Settlement Rail** and can generate quote payloads for facilitator handoff.

## Etherfuse Activation (Backend + Frontend)

The base Etherfuse integration is available in the payments module and exposed in the Pix screen.

### 1. Required backend environment variables

Set the following variables in `apps/backend/.env`:

```env
# etherfuse mode: disabled | stub | live
ETHERFUSE_MODE=stub

# Sandbox or production API base
ETHERFUSE_API_BASE_URL=https://api.sand.etherfuse.com

# API key must be passed as raw Authorization header (no Bearer prefix)
ETHERFUSE_API_KEY=replace-with-real-key

# Required for live quote creation in this integration
ETHERFUSE_CUSTOMER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Required for live order creation (unless provided per request)
ETHERFUSE_BANK_ACCOUNT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Optional defaults used by the quote endpoint
ETHERFUSE_BLOCKCHAIN=stellar
ETHERFUSE_DEFAULT_QUOTE_TYPE=onramp
ETHERFUSE_SOURCE_ASSET=MXN
ETHERFUSE_TARGET_ASSET=USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
ETHERFUSE_WALLET_ADDRESS=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional stub tuning for local demos
ETHERFUSE_STUB_EXCHANGE_RATE=0.19
ETHERFUSE_STUB_FEE_BPS=35
```

### 2. Verify integration

Status endpoint:

```bash
curl -s http://localhost:3001/payments/etherfuse/status
```

Sample quote:

```bash
curl -s -X POST http://localhost:3001/payments/etherfuse/quote \
	-H 'Content-Type: application/json' \
	-d '{"amount":"150","quoteType":"onramp"}'
```

Sample order from quote id:

```bash
curl -s -X POST http://localhost:3001/payments/etherfuse/order \
	-H 'Content-Type: application/json' \
	-d '{"quoteId":"<quote-id>"}'
```

Expected behavior:

- `mode=stub` without live API credentials.
- `mode=live` when `ETHERFUSE_API_BASE_URL` + `ETHERFUSE_API_KEY` are configured.
- Pix page shows **Etherfuse FX Rail** and can generate onramp/offramp quotes plus order payloads.

## Architecture Highlights

- **Digital Sovereignty** --- Full handover to the DAO and decentralized control. [██████████] 100%
- **Liquid Staking (sXLM)** --- Native Lumen staking to maximize community yield. [██████████] 100%
- **Institutional Vaults** --- Segregated vaults with enterprise compliance and whitelisting. [██████████] 100%
- **Global Liquidity Hub** --- Institutional routing for large volume orders ($1M+). [██████████] 100%
- **AI Tax Reporting** --- Automated global tax compliance assisted by AI. [██████████] 100%
- **Referral System On-chain** --- On-chain referral program with rewards and fee discounts. [██████████] 100%
- **RWA Lifecycle 2.0** --- Full real-world asset cycle with auctions and per-asset governance. [██████████] 100%
- **Validated Performance** --- Successful institutional stress tests with optimized latency. [██████████] 100%

## Core Features

- **DeFi Credit Infrastructure:** Complete lending and borrowing platform with AI-powered risk assessment.
- **Stablecoin STLT-BRL:** Brazilian Real-pegged stablecoin with 120%+ collateralization.
- **Governance System:** Progressive decentralization (Multisig to DAO).
- **Wallet Integration:** Freighter, Ledger, Albedo support.
- **PIX Integration:** Instant BRL mint/burn via Stellar Anchors.
- **KYC/AML Compliance:** Multi-tier limits, audit trail, and real-time compliance gating.
- **Security Features:** Passkey authentication, session keys, reserve monitoring.
- **AI Risk Agent:** ElizaOS RiskGuardian with ZK credit scoring (Groth16).
- **Sub-500ms Oracles:** Reflector Network + Stellar DEX fallback.

## Project Flow Diagram

```mermaid
flowchart LR
	U[Usuário e Operações]

	subgraph UX[Camada de Experiência]
		WEB[Web App\nNext.js (App Router)]
		MOB[Mobile App\nExpo / React Native]
		ADM[Admin / Ops UI]
		WALLET[Wallets\nFreighter / Ledger / Albedo]
		ZKGEN[ZK Proof (cliente)\nSnarkJS + Groth16]
	end

	subgraph API[Camada de Aplicação (NestJS)]
		GW[Backend API]
		AUTH[Auth + Passkeys + Sessions]
		RISK[Risk + Compliance]
		PAY[Payments]
		GOV[Governance]
		RWA[RWA + SSI]
	end

	subgraph Integrations[Integrações Externas]
		PIX[Celcoin\nPIX / BaaS]
		CARDS[Dock\nCards]
		KYC[Sumsub\nKYC]
		X402[x402 Facilitator]
		EF[Etherfuse API]
	end

	subgraph ChainAccess[Infra de Chain]
		RPC[Soroban RPC]
		HZN[Horizon]
	end

	subgraph Chain[Stellar + Soroban (Contratos)]
		CST[Stablecoin]
		CLN[LoansPool]
		CDAO[DAO Governance]
		CREC[Recurring Payments]
		CRWA[RWA Tokenizer / Marketplace]
		CVC[VC Registry]
		CMEV[Batch Executor + MEV Guard]
		CZK[ZK Verifier]
	end

	subgraph Data[Dados e Operação]
		PG[(PostgreSQL)]
		RD[(Redis)]
	end

	subgraph Obs[Observabilidade]
		OTEL[OpenTelemetry\nLogs / Metrics / Traces]
		SEN[Sentry]
		IDX[Chain Event Ingestor]
		AUD[Compliance / Audit Evidence]
	end

	U --> WEB
	U --> MOB
	U --> ADM

	WEB <--> WALLET
	MOB <--> WALLET

	WEB --> ZKGEN
	MOB --> ZKGEN
	ZKGEN --> GW

	WEB --> GW
	MOB --> GW
	ADM --> GW

	GW --> AUTH
	GW --> RISK
	GW --> PAY
	GW --> GOV
	GW --> RWA

	PAY --> PIX
	PAY --> CARDS
	PAY --> X402
	PAY --> EF
	RISK --> KYC

	GW --> PG
	GW --> RD

	WALLET --> RPC
	GW --> RPC
	GW --> HZN

	RPC --> CST
	RPC --> CLN
	RPC --> CDAO
	RPC --> CREC
	RPC --> CRWA
	RPC --> CVC
	RPC --> CMEV
	RPC --> CZK

	HZN --> IDX
	RPC --> IDX
	IDX --> PG

	RISK --> OTEL
	PAY --> OTEL
	AUTH --> OTEL
	GW --> OTEL
	GW --> SEN

	PG --> AUD
	OTEL --> AUD
```

## Deployment Registry and Explorer Links

Canonical source for contract deployment data:
- `docs/SMART_CONTRACT_DEPLOYMENT_REGISTRY.md`

### Testnet V5 Manifest

| Contract | Contract ID | Stellar Expert |
| :--- | :--- | :--- |
| **Recurring Payments** | `CCD4OHCNA27Z7FUDAA3YSSYCOZE2ZI4ZWSR6QC363LOMWUCFJDNZT7ED` | https://stellar.expert/explorer/testnet/contract/CCD4OHCNA27Z7FUDAA3YSSYCOZE2ZI4ZWSR6QC363LOMWUCFJDNZT7ED |
| **DAO Governance** | `CDJ7KQDEROW7TH4YYTSHVV7KKMDWMDOBS76UENIP6N4JPYQCD4YR37QW` | https://stellar.expert/explorer/testnet/contract/CDJ7KQDEROW7TH4YYTSHVV7KKMDWMDOBS76UENIP6N4JPYQCD4YR37QW |
| **Institutional Vault** | `CA2VG7TADA2JQQICK43Q33XYF5T6YMHUTM3CMKKGUJV5HFVTGCNQCWAH` | https://stellar.expert/explorer/testnet/contract/CA2VG7TADA2JQQICK43Q33XYF5T6YMHUTM3CMKKGUJV5HFVTGCNQCWAH |
| **Insurance Pool** | `CCIX35HUAEROVZR6WI76YB5IPDD3SN4EQFGWFHL4ZSO6FOKNNYJWI6XS` | https://stellar.expert/explorer/testnet/contract/CCIX35HUAEROVZR6WI76YB5IPDD3SN4EQFGWFHL4ZSO6FOKNNYJWI6XS |

### Testnet Deployment Snapshot (2026-05-11)

Sources:
- `docs/SMART_CONTRACT_DEPLOYMENT_REGISTRY.md`
- `docs/CONTRACT_DEPLOYMENT_GUIDE.md`

| Contract | Env Key | Contract ID | Stellar Expert |
| :--- | :--- | :--- | :--- |
| Stablecoin | `STABLECOIN_CONTRACT_ID` | `CCOOH5HD7QPRLE2M7ENDUS3HFMBFEH6QNUCBTY6W3XV7TKQ2VVOP6DPU` | https://stellar.expert/explorer/testnet/contract/CCOOH5HD7QPRLE2M7ENDUS3HFMBFEH6QNUCBTY6W3XV7TKQ2VVOP6DPU |
| RiskLock | `RISKLOCK_CONTRACT_ID` | `CAWWAXLYRDVJLNT4KINIK5BOYZSMQZGOJIUYBU2B7CBLQXUM7PG5ZDBX` | https://stellar.expert/explorer/testnet/contract/CAWWAXLYRDVJLNT4KINIK5BOYZSMQZGOJIUYBU2B7CBLQXUM7PG5ZDBX |
| LoansPool | `LOANSPOOL_CONTRACT_ID` | `CBDNBEKIXEKCJPDBSAEBNJ62ZENE4ZJG2EVOTGBYOHJ7SXQ5K6OPUO25` | https://stellar.expert/explorer/testnet/contract/CBDNBEKIXEKCJPDBSAEBNJ62ZENE4ZJG2EVOTGBYOHJ7SXQ5K6OPUO25 |
| Portfolio | `PORTFOLIO_CONTRACT_ID` | `CB34KFLFRDTG36NUCW2VBAIGKMM4FVIWK7FL76H6RTSEZZT7PQ2XZPYL` | https://stellar.expert/explorer/testnet/contract/CB34KFLFRDTG36NUCW2VBAIGKMM4FVIWK7FL76H6RTSEZZT7PQ2XZPYL |
| Governance | `GOVERNANCE_CONTRACT_ID` | `CCA6ZOLV2S5AR43VS47KJZSPSV4NGHCPAFQG3DK7UJBOUXIVGGIXQMRO` | https://stellar.expert/explorer/testnet/contract/CCA6ZOLV2S5AR43VS47KJZSPSV4NGHCPAFQG3DK7UJBOUXIVGGIXQMRO |
| ZK Verifier | `ZK_VERIFIER_CONTRACT_ID` | `CBDBZ4V2A4LBWJ2SGCKLIFTINMTEG626S2NH2DPLHZDDCCHRACID5E7L` | https://stellar.expert/explorer/testnet/contract/CBDBZ4V2A4LBWJ2SGCKLIFTINMTEG626S2NH2DPLHZDDCCHRACID5E7L |
| VC Registry | `VC_REGISTRY_ID` | `CD3IEVYYTYUYPLM7WT335SM4AO7FX4VMWR5DWXEL3D7CFTDT5NPNRV3Z` | https://stellar.expert/explorer/testnet/contract/CD3IEVYYTYUYPLM7WT335SM4AO7FX4VMWR5DWXEL3D7CFTDT5NPNRV3Z |
| Batch Executor | `BATCH_EXECUTOR_CONTRACT_ID` | `CATVMEW7IXDGXZ333K3YWOXAHX3FXZ3CTWNRYZQUJTPK2SISTOFXFGP2` | https://stellar.expert/explorer/testnet/contract/CATVMEW7IXDGXZ333K3YWOXAHX3FXZ3CTWNRYZQUJTPK2SISTOFXFGP2 |
| MEV Guard | `MEV_GUARD_CONTRACT_ID` | `CCNXG3ZSXVI6X7MTCNYMYCNDP3TH43PQNZUKZHCFAQ72RXSEQNWK6L4J` | https://stellar.expert/explorer/testnet/contract/CCNXG3ZSXVI6X7MTCNYMYCNDP3TH43PQNZUKZHCFAQ72RXSEQNWK6L4J |

### Strict Testnet Validation Snapshot (2026-04-20)

Source: `contracts/reports/20260420_rc_strict/evidence_report.md`.

| Contract | Contract ID | Stellar Expert |
| :--- | :--- | :--- |
| Stablecoin | `CAB2HQ7XQ2CS4ROO4E3PZVJASXUNEKWTDFGRRGIPVUFHGQC24HKZHJIZ` | https://stellar.expert/explorer/testnet/contract/CAB2HQ7XQ2CS4ROO4E3PZVJASXUNEKWTDFGRRGIPVUFHGQC24HKZHJIZ |
| Batch Executor | `CDZZQYUKOSTHDOUCU273NHRVYJ67A37JC5SL3JAOJ77FUT4KGQXSJBUI` | https://stellar.expert/explorer/testnet/contract/CDZZQYUKOSTHDOUCU273NHRVYJ67A37JC5SL3JAOJ77FUT4KGQXSJBUI |
| MEV Guard | `CAHZYMMJVZN4JESEXMCVVOVTOE3A5AISNK3IWTZRDBXW3ZK2ZKBFSFHD` | https://stellar.expert/explorer/testnet/contract/CAHZYMMJVZN4JESEXMCVVOVTOE3A5AISNK3IWTZRDBXW3ZK2ZKBFSFHD |

Key strict-validation transaction traces (Stellar Expert):

- Smoke mutation tx: https://stellar.expert/explorer/testnet/tx/a7a88dbe70af63708eb6840cec8de7e822e8c4c80ac41627599213c120b7461f
- Transactional E2E tx #1: https://stellar.expert/explorer/testnet/tx/8fe04c0a733ea57c5093fc7c52f0c4251201a2e3a4b21c9e72f2bcfe26f4136e
- Transactional E2E tx #2: https://stellar.expert/explorer/testnet/tx/11409e21b411b02c39812a403a0a946b72629358787b2702c594a4c9ffd8990b
- Transactional E2E tx #3: https://stellar.expert/explorer/testnet/tx/efff48f37f2c6dc93d11e0498e0d422c5ded8ce2b6720009543be9366774f07b
- Transactional E2E tx #4: https://stellar.expert/explorer/testnet/tx/38813333d1ec1f2b216d00fa7d30b348c1d3e9bb7471863aa6e2a24eea5930cc
- Transactional E2E tx #5: https://stellar.expert/explorer/testnet/tx/a899d6a0f0f08840eeb83a7fc7a0537f4c0a092db6596f91752f78254587c5c7

### Latest Operational Evidence Bundle (2026-04-25)

Source: `contracts/reports/20260425_104952/evidence_report.md`.

- Network: testnet
- Source address: `GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX`
- Git commit in bundle: `c941ed6a`
- Bundle Contract ID (Stablecoin): `CCX2C7SN3RXKAVTFTNBQ5MCWLY2WEGXWGRKVFKJ427HN745CHXNRRBVG`
- Bundle Contract ID (Batch Executor): `CDZZQYUKOSTHDOUCU273NHRVYJ67A37JC5SL3JAOJ77FUT4KGQXSJBUI`
- Bundle Contract ID (MEV Guard): `CAHZYMMJVZN4JESEXMCVVOVTOE3A5AISNK3IWTZRDBXW3ZK2ZKBFSFHD`

### Mainnet Status

- Mainnet deployment is documented as operationally successful in `docs/MAINNET_DEPLOYMENT_RESULT.md`.
- Source of truth: `docs/SMART_CONTRACT_DEPLOYMENT_REGISTRY.md` and `.env-prod` (mainnet contract IDs).
- Deployment registry output (generated by `tools/deploy_v4.sh`, ignored by git): `mainnet_deployment_registry.json`.
- Release governance reference: `docs/MAINNET_DEPLOYMENT_RESULT.md`
- Release readiness reference: `docs/MAINNET_CHECKLIST_COMPLETE.md`
- Mainnet onboarding reference: `docs/MAINNET_ONBOARDING_GUIDE.md`

### Mainnet Deployment Snapshot (2026-05-30)

| Contract Module | Contract ID | Stellar Expert |
| :--- | :--- | :--- |
| portfolio | CDW75QCGLFDFSE326JYJSJG4R2YYPTDSLDWGZFXYLKZBQKSBUV5B5VF6 | https://stellar.expert/explorer/public/contract/CDW75QCGLFDFSE326JYJSJG4R2YYPTDSLDWGZFXYLKZBQKSBUV5B5VF6 |
| stablecoin | CCW7JVVL5JKESJHTMECOXCHPIFV7N4K3HDKSN67QUNB35B2HFLDI5AXL | https://stellar.expert/explorer/public/contract/CCW7JVVL5JKESJHTMECOXCHPIFV7N4K3HDKSN67QUNB35B2HFLDI5AXL |
| risklock | CCEGNQ7RS5UB4PDTSHRZJRA26UNVROCRSEN6IV4US5W4LQHNDTALL4C3 | https://stellar.expert/explorer/public/contract/CCEGNQ7RS5UB4PDTSHRZJRA26UNVROCRSEN6IV4US5W4LQHNDTALL4C3 |
| loans_pool | CAWB5URQB6AL6YV5ASI7WHHMPDC6SGWYBY5X656PIPXT5OECAYSGPTUI | https://stellar.expert/explorer/public/contract/CAWB5URQB6AL6YV5ASI7WHHMPDC6SGWYBY5X656PIPXT5OECAYSGPTUI |
| governance | CBB3FGR6CJAAXPDHQDJOW54RAEQ35SWMULMDFV4KO73ZTJMWZ2M6YAWH | https://stellar.expert/explorer/public/contract/CBB3FGR6CJAAXPDHQDJOW54RAEQ35SWMULMDFV4KO73ZTJMWZ2M6YAWH |
| zk_verifier | CCX7LH2BQUV35ALSGQPP3N7ZNLZVJQJVXSAPJELHOPWWAQ3DZ3XP4HIQ | https://stellar.expert/explorer/public/contract/CCX7LH2BQUV35ALSGQPP3N7ZNLZVJQJVXSAPJELHOPWWAQ3DZ3XP4HIQ |
| batch_executor | CC6CREAKIXSX24DHY3LSNYGO322XJHP5BOUFYGLKKJEDFCO2LDZCZ747 | https://stellar.expert/explorer/public/contract/CC6CREAKIXSX24DHY3LSNYGO322XJHP5BOUFYGLKKJEDFCO2LDZCZ747 |
| mev_guard | CBCB3CH6V6UUN6SID374CP3VHHFV5M55R5F6H6WTRFH3X3EVT6HIMIHZ | https://stellar.expert/explorer/public/contract/CBCB3CH6V6UUN6SID374CP3VHHFV5M55R5F6H6WTRFH3X3EVT6HIMIHZ |
| vc_registry | CAQBZTC53L4CO7LQQ72XLQG7NYYG5JWMH6BER4IFVKAWUM5IYNB7IJSN | https://stellar.expert/explorer/public/contract/CAQBZTC53L4CO7LQQ72XLQG7NYYG5JWMH6BER4IFVKAWUM5IYNB7IJSN |
| rwa_tokenizer | CD37GRKZCESRVUFDSTMMQZGUUJ2HWBWLR52AR4MRJFJQPFQ5IL7MRCFN | https://stellar.expert/explorer/public/contract/CD37GRKZCESRVUFDSTMMQZGUUJ2HWBWLR52AR4MRJFJQPFQ5IL7MRCFN |
| dao_governance | CDOVGJQOQ22YOAUMK5DBELHJXJEN5MO4LVAQUDJULSHE7OI63HNEEGOH | https://stellar.expert/explorer/public/contract/CDOVGJQOQ22YOAUMK5DBELHJXJEN5MO4LVAQUDJULSHE7OI63HNEEGOH |
| recurring_payments | CDESEWHWPTTEDWF7PNYW23RKNBV4NTW3U6456OICDLD3FCRL7Y33LGBB | https://stellar.expert/explorer/public/contract/CDESEWHWPTTEDWF7PNYW23RKNBV4NTW3U6456OICDLD3FCRL7Y33LGBB |
| insurance_pool | CCSNWO2PZFZ6OUMTGRRBT23X5BOW22JU32E6VYJFHLJHWLQLZPH7YUPZ | https://stellar.expert/explorer/public/contract/CCSNWO2PZFZ6OUMTGRRBT23X5BOW22JU32E6VYJFHLJHWLQLZPH7YUPZ |
| bridge_adapter | CDWIGKW2VVA7YZUCTRDSGCZ3AI2XNKMLFBRWT65OWHUXMF5BVSBRPDOB | https://stellar.expert/explorer/public/contract/CDWIGKW2VVA7YZUCTRDSGCZ3AI2XNKMLFBRWT65OWHUXMF5BVSBRPDOB |
| rwa_marketplace | CBRCT3YLI47EUSOGLORVO5NZVBRVEHMVDFY4ORGABKAUOWFJHYOI45YQ | https://stellar.expert/explorer/public/contract/CBRCT3YLI47EUSOGLORVO5NZVBRVEHMVDFY4ORGABKAUOWFJHYOI45YQ |
| institutional_vault | CDA4EO7THZDQGKEVNTVID4EOLBYWUWXFF7IOOWCYGWATUUPJHCSHNSB2 | https://stellar.expert/explorer/public/contract/CDA4EO7THZDQGKEVNTVID4EOLBYWUWXFF7IOOWCYGWATUUPJHCSHNSB2 |
| liquid_staking | CBXIENCX2GW7N76HXW7YWLU4NHHBVATPPAIBINV5EY7NNA7NT4JYAY4N | https://stellar.expert/explorer/public/contract/CBXIENCX2GW7N76HXW7YWLU4NHHBVATPPAIBINV5EY7NNA7NT4JYAY4N |
| multisig_adapter | CCL3OD6EMUFBET7V6SBAFY7QAAXS2NZDSZBJJXATXROGCONRJKPMT7JW | https://stellar.expert/explorer/public/contract/CCL3OD6EMUFBET7V6SBAFY7QAAXS2NZDSZBJJXATXROGCONRJKPMT7JW |
| referral_system | CCJ3KSRDCBKE5MURRJTB4AD7657WNQK4YIJDDXAQJXLH5VTJ65ZYYN72 | https://stellar.expert/explorer/public/contract/CCJ3KSRDCBKE5MURRJTB4AD7657WNQK4YIJDDXAQJXLH5VTJ65ZYYN72 |

**Primary admin/source account (testnet evidence and snapshots):** `GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX`

## Technical Documentation

For detailed information, please refer to:

- [Documentation Index](docs/DOCUMENTATION_INDEX.md)
- [Getting Started Guide](docs/START_HERE.md)
- [x402 Integration Guide](docs/X402_INTEGRATION.md)
- [x402 Testing Guide](docs/X402_TESTING.md)
- [Etherfuse Integration Guide](docs/ETHERFUSE_INTEGRATION.md)
- [Etherfuse Testing Guide](docs/ETHERFUSE_TESTING.md)
- [Security Audit Report](docs/SECURITY_AUDIT_REPORT.md)
- [Security Upgrade Sprint](docs/SECURITY_UPGRADE_SPRINT_MAY_2026.md)
- [Getting Started Guide](docs/START_HERE.md)

---
Stellaro V5 Protocol.
