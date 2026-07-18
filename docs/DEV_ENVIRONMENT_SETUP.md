# Development Environment Setup

## Prerequisites

- Node.js LTS
- Python 3.10+
- Docker and Docker Compose

## Quick Setup

1. Clone the repository:
   `git clone https://github.com/Jistriane/Stellaro.git`
2. Enter the monorepo root:
   `cd /home/jistriane/Stellaro/Stellaro`
3. Install dependencies:
   `npm install`
4. Validate the local environment before boot:
   `npm run doctor:local-dev`
5. Start the default stack:
   `npm run dev:stack`

## Official Local Modes

- Default daily mode: `public-testnet`
- Optional integration mode: `local-chain`
- Source of truth: [LOCAL_DEV_MODES.md](LOCAL_DEV_MODES.md)

Useful commands:

```bash
npm run doctor:local-dev
npm run dev:stack
npm run doctor:local-chain
npm run dev:stack:local-chain
```

Main local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- Swagger: `http://localhost:3001/docs`
- Grafana: `http://localhost:3003`
- Prometheus: `http://localhost:9090`

## Tests

Run workspace-aware commands from the repository root when possible:

```bash
npm test
npm run lint
npm run build
```

For service-specific flows, follow the dedicated guides under `docs/`, `apps/`, `agents/`, and `contracts/`.
