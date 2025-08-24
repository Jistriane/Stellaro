# Stelato Monorepo

Welcome to the Stelato project! This monorepo contains the initial architecture for a financial services platform, featuring a Next.js 14 frontend and a NestJS backend, with integrations for Stellar/Soroban, PIX, Cards, KYC, and Passkeys.

## Project Structure

- **`apps/frontend`**: Next.js 14 application.
- **`apps/backend`**: NestJS application with Prisma, Redis, and more.
- **`contracts/`**: Soroban smart contracts written in Rust.
- **`packages/`**: Shared UI components and configurations.
- **`infra/`**: Docker files, deployment scripts, and CI/CD configurations.

## Documentation

**For a complete guide to the project's architecture, setup, development, and features, please see the full documentation in the `docs/` directory.**

- **[English Manual](./docs/Manual.EN.md)**
- **[Manual em Português](./docs/Manual.pt-BR.md)**

## Getting Started

1.  **Prerequisites**: Ensure you have Node.js (v20+), npm (v10+), Docker, and the Rust toolchain installed.
2.  **Clone the repository**:
    ```bash
    git clone <your-repository-url>
    cd Stelato
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Configure your environment**:
    ```bash
    cp .env-example .env-dev
    ```
    Then, edit `.env-dev` with your local configuration.

5.  **Start the development environment**:
    ```bash
    # Start local database and cache
    docker compose -f infra/docker-compose.dev.yml up -d

    # Run all applications
    npm run dev
    ```

Refer to the full documentation for details on database migration, smart contract deployment, and more.
