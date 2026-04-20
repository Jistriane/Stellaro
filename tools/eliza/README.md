# Stellaro ElizaOS Agents

AI-powered agents for DeFi risk management, compliance, and treasury optimization on Stellar.

## Agents

### 1. **Stellaro Risk** 
- Portfolio risk analysis
- Volatility monitoring
- Liquidity risk detection
- Automated risk mitigation

### 2. **Compliance Bot** 
- KYC/AML monitoring
- Transaction limit enforcement
- Regulatory compliance checks
- Suspicious activity detection

### 3. **Treasury Manager** 
- Yield optimization
- Auto-compound rewards
- Portfolio rebalancing
- DeFi strategy execution

## Setup

### Prerequisites
- Node.js >= 20
- Stellar account with secret key
- Anthropic API key (Claude)
- Backend API running

### Installation

```bash
npm install
```

### Configuration

Create `.env` file:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...
STELLAR_SECRET_KEY=S...
BACKEND_URL=http://localhost:3001

# Optional (for clients)
TELEGRAM_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...
REFLECTOR_API_KEY=...
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## Architecture

```
tools/eliza/
├── src/
│   ├── characters/        # Agent personalities
│   │   ├── stellaro-risk.ts
│   │   ├── compliance-bot.ts
│   │   └── treasury-manager.ts
│   ├── actions/           # Agent capabilities
│   │   ├── analyzePortfolioRisk.ts
│   │   ├── checkTransactionCompliance.ts
│   │   └── optimizeTreasuryYield.ts
│   └── index.ts           # Runtime orchestrator
├── package.json
├── tsconfig.json
└── README.md
```

## Actions

### Risk Analysis
```typescript
{
  name: "ANALYZE_PORTFOLIO_RISK",
  description: "Analyzes DeFi portfolio for risks",
  outputs: {
    risksDetected: number,
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    recommendation: string
  }
}
```

### Compliance Check
```typescript
{
  name: "CHECK_TRANSACTION_COMPLIANCE",
  description: "Validates transaction against regulatory limits",
  outputs: {
    approved: boolean,
    violations: Array<Violation>,
    action: "APPROVE" | "BLOCK"
  }
}
```

### Yield Optimization
```typescript
{
  name: "OPTIMIZE_TREASURY_YIELD",
  description: "Finds better APY opportunities",
  outputs: {
    opportunities: number,
    estimatedGain: number,
    migrationPlan: Array<Migration>
  }
}
```

## Integration

Agents communicate with Stellaro backend via REST API:

- `GET /risk/analyze/:address` - Portfolio risk analysis
- `POST /compliance/check-transaction` - Compliance validation
- `GET /defi/treasury/optimize/:address` - Yield optimization
- `POST /defi/blend/auto-compound` - Auto-compound execution

## Clients

Supported communication platforms:

- **Telegram**: Real-time alerts and commands
- **Discord**: Community engagement and monitoring
- **API**: Programmatic access (future)

## License

MIT
