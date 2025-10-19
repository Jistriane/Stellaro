<div align="center">
  <img src="Logo.png" alt="Stellaro Logo" width="200"/>
  
  # Stellaro DeFi Credit Infrastructure on Stellar
  
  *Infraestrutura DeFi de Crédito na Stellar*
</div>

Welcome to the Stellaro project! This monorepo contains the complete architecture for a DeFi credit infrastructure platform built on Stellar, featuring a Next.js 14 frontend and a NestJS backend, with integrations for Stellar/Soroban, PIX, Cards, KYC, and Passkeys.

Bem-vindo ao projeto Stellaro! Este monorepo contém a arquitetura completa para uma plataforma de infraestrutura DeFi de crédito construída na Stellar, com frontend Next.js 14 e backend NestJS, integrando Stellar/Soroban, PIX, Cartões, KYC e Passkeys.

## Features / Funcionalidades

### Core Features / Funcionalidades Principais
- 🏦 **DeFi Credit Infrastructure** - Complete lending and borrowing platform
- 💳 **Stablecoin Management** - STLT token with 1:1 backing
- 🏛️ **Governance System** - DAO-based decision making
- 🔐 **Wallet Integration** - Multiple Stellar wallet support
- 📱 **PIX Integration** - Brazilian instant payment system
- 🎯 **KYC/AML Compliance** - Identity verification system
- 🔒 **Security Features** - Risk management and account locking

### Tecnologias / Technologies
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: NestJS, Prisma, Redis, PostgreSQL
- **Blockchain**: Stellar, Soroban Smart Contracts (Rust)
- **Payments**: PIX, Card processing, Multi-currency support
- **Security**: Passkeys, 2FA, Risk assessment

## Project Structure / Estrutura do Projeto

- **`apps/frontend`**: Next.js 14 application with modern UI components and wallet integration.
  - *Aplicação Next.js 14 com componentes de UI modernos e integração de carteira.*
- **`apps/backend`**: NestJS application with Prisma, Redis, and comprehensive API services.
  - *Aplicação NestJS com Prisma, Redis e serviços de API abrangentes.*
- **`contracts/`**: Soroban smart contracts written in Rust for DeFi operations.
  - *Contratos inteligentes Soroban escritos em Rust para operações DeFi.*
- **`packages/`**: Shared UI components and configurations across the monorepo.
  - *Componentes de UI compartilhados e configurações em todo o monorepo.*
- **`infra/`**: Docker files, deployment scripts, and CI/CD configurations.
  - *Arquivos Docker, scripts de deploy e configurações de CI/CD.*

## Documentation / Documentação

**For a complete guide to the project's architecture, setup, development, and features, please see the full documentation in the `docs/` directory.**

**Para um guia completo da arquitetura do projeto, configuração, desenvolvimento e funcionalidades, consulte a documentação completa no diretório `docs/`.**

- **[English Manual](./docs/Manual.EN.md)**
- **[Manual em Português](./docs/Manual.pt-BR.md)**

## Getting Started / Começando

### Prerequisites / Pré-requisitos
- Node.js (v20+)
- npm (v10+)
- Docker
- Rust toolchain

### Setup / Configuração

1.  **Clone the repository / Clone o repositório**:
    ```bash
    git clone https://github.com/Jistriane/Stellaro.git
    cd Stellaro
    ```

2.  **Install dependencies / Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Configure your environment / Configure seu ambiente**:
    ```bash
    cp .env-example .env-dev
    ```
    Then, edit `.env-dev` with your local configuration.
    *Em seguida, edite `.env-dev` com sua configuração local.*

4.  **Start the development environment / Inicie o ambiente de desenvolvimento**:
    ```bash
    # Start local database and cache / Inicie banco de dados e cache locais
    docker compose -f infra/docker-compose.dev.yml up -d

    # Run all applications / Execute todas as aplicações
    npm run dev
    ```

### Access / Acesso
- **Frontend**: http://localhost:3000 (or 3002 if port 3000 is busy)
- **Backend API**: http://localhost:3001

Refer to the full documentation for details on database migration, smart contract deployment, and more.
*Consulte a documentação completa para detalhes sobre migração de banco de dados, deploy de contratos inteligentes e muito mais.*

## Contributing / Contribuindo

We welcome contributions to the Stellaro project! Please see our contributing guidelines and code of conduct.

Aceitamos contribuições para o projeto Stellaro! Consulte nossas diretrizes de contribuição e código de conduta.

### Development / Desenvolvimento
- Fork the repository / Faça fork do repositório
- Create a feature branch / Crie uma branch de feature
- Make your changes / Faça suas alterações
- Submit a pull request / Envie um pull request

## License / Licença

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Este projeto está licenciado sob a Licença MIT - consulte o arquivo [LICENSE](LICENSE) para detalhes.

## Support / Suporte

For support and questions, please open an issue on GitHub or contact the development team.

Para suporte e dúvidas, abra uma issue no GitHub ou entre em contato com a equipe de desenvolvimento.

---

<div align="center">
  <p>Built with ❤️ using Stellar and Soroban</p>
  <p>Construído com ❤️ usando Stellar e Soroban</p>
</div>
