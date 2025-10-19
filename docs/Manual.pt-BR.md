# Manual do Projeto Stellaro (PT-BR)

Este documento fornece um guia completo para o monorepo Stellaro, cobrindo sua arquitetura, configuração, desenvolvimento e principais funcionalidades. Destina-se a desenvolvedores, administradores de sistemas e todos os envolvidos no ciclo de vida do projeto.

## 1. Visão Geral da Arquitetura

Stellaro é um monorepo Turborepo projetado para serviços financeiros, integrando tecnologias tradicionais e blockchain.

- **`apps/frontend`**: Uma aplicação Next.js 14 usando o App Router, i18n (PT-BR padrão, EN), shadcn/ui, Zustand e React Query.
- **`apps/backend`**: Uma aplicação NestJS (Node 20) com Prisma (Postgres), Redis/BullMQ para cache e filas, OpenAPI para documentação de API e OpenTelemetry/Sentry para observabilidade.
- **`contracts/`**: Um workspace Rust para smart contracts Soroban, incluindo `stablecoin`, `risklock`, `loans_pool`, `portfolio` e `governance`.
- **`packages/ui`**: Componentes React compartilhados para uma UI consistente (tema `Stellato`).
- **`packages/config`**: Configurações compartilhadas para ESLint, TypeScript e Prettier.
- **`infra/`**: Infraestrutura como Código, incluindo Docker Compose para desenvolvimento local, scripts de deploy e manifestos de CI/CD.

### Ambientes e DNS

- **Produção**: `app.stelato.com.br` (frontend) e `api.stelato.com.br` (backend)
- **Staging**: `staging.stelato.com.br`
- **Desenvolvimento**: `dev.stelato.com.br`

Esses domínios também servem como RP IDs para autenticação Passkey em seus respectivos ambientes.

## 2. Primeiros Passos

### 2.1. Pré-requisitos

- **Node.js**: Versão 20 ou superior.
- **npm**: Versão 10 ou superior.
- **Docker & Docker Compose**: Para rodar a infraestrutura local (Postgres, Redis).
- **Git**: Para controle de versão.
- **Rust Toolchain**: Necessário para o desenvolvimento de smart contracts (`rustup target add wasm32-unknown-unknown`).
- **Soroban CLI**: Para fazer o deploy e interagir com os smart contracts.

Opcional para integrações específicas:
- **Bun**: Para executar o agente ElizaOS.
- **ElizaOS CLI**: Para interagir com o agente de análise de risco.

### 2.2. Configuração Inicial

1.  **Clone o repositório**:
    ```bash
    git clone <url-do-seu-repositorio>
    cd Stellaro
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente**:
    Copie o arquivo de exemplo e personalize-o para o seu ambiente local.
    ```bash
    cp .env-example .env-dev
    ```
    Edite o `.env-dev` com os valores necessários. Veja a seção **Variáveis de Ambiente** para mais detalhes.

4.  **Inicie a infraestrutura local**:
    Este comando inicia os contêineres do Postgres e Redis em segundo plano.
    ```bash
    docker compose -f infra/docker-compose.dev.yml up -d
    ```

5.  **Execute as migrações do banco de dados**:
    Isso gera o cliente Prisma e aplica quaisquer migrações pendentes.
    ```bash
    npm run prisma:generate -w apps/backend
    npm run prisma:migrate -w apps/backend
    ```

### 2.3. Executando a Aplicação

Inicie todas as aplicações em modo de desenvolvimento:
```bash
npm run dev
```
- **Frontend**: Acessível em `http://localhost:3000`
- **Backend**: Acessível em `http://localhost:3333` (a porta pode ser alterada via `PORT` no `.env-dev`)

## 3. Variáveis de Ambiente

Principais variáveis a serem configuradas no `.env-dev`:

- **API**: `PORT`, `NODE_ENV`, `CORS_ORIGINS`, `JWT_SECRET`, `SESSION_TTL`
- **Banco de Dados & Cache**: `DATABASE_URL`, `REDIS_URL`
- **Stellar/Soroban**: `STELLAR_NETWORK`, `SOROBAN_RPC_URL`, `HORIZON_URL`
- **Serviços de Terceiros**:
  - `CELCOIN_CLIENT_ID`, `CELCOIN_CLIENT_SECRET`
  - `DOCK_API_KEY`, `DOCK_WEBHOOK_SECRET`
  - `SUMSUB_APP_TOKEN`, `SUMSUB_SECRET_KEY`
- **Observabilidade**: `OTEL_EXPORTER_OTLP_ENDPOINT`, `SENTRY_DSN`
- **Segurança**: `ADMIN_TOKEN`, `ELIZA_WEBHOOK_SECRET`, `WEBHOOK_HMAC_SECRET`

## 4. Smart Contracts Soroban

O diretório `contracts/` contém todos os smart contracts Soroban. O script `infra/deploy_soroban.sh` automatiza o processo de build, deploy e inicialização.

### 4.1. Deploy

1.  **Importe sua chave de deployer** para a Soroban CLI:
    ```bash
    soroban keys add deploy --secret-key # Cole sua chave secreta
    ```

2.  **Execute o script de deploy**:
    O script compila, implanta e inicializa todos os contratos. É idempotente e seguro para reexecutar.
    ```bash
    ./infra/deploy_soroban.sh deploy
    ```
    Após a execução, ele atualizará o `.env-dev` com os IDs dos novos contratos (`STABLECOIN_CONTRACT_ID`, `RISKLOCK_CONTRACT_ID`, etc.).

### 4.2. Stablecoins (STLT-BRL, STLT-USD)

- **Decimais**: 7 casas decimais on-chain, exibidas com 2 casas decimais na UI.
- **Taxas**: Mint (0%), Burn (0%), Transferência (0.1%). As taxas são ajustáveis via governança.

## 5. API Backend & Segurança

O backend expõe uma API RESTful com um forte foco em segurança.

### 5.1. Endpoints Principais

URL Base: `http://localhost:3333`

- **Autenticação Passkey (WebAuthn)**:
  - `POST /passkey/register/init` & `.../verify`
  - `POST /passkey/login/init` & `.../verify`
  - `POST /passkey/tx/init` & `.../verify` (para assinatura de transações)

- **MFA (Fallback com Stellar)**:
  - `POST /passkey/mfa/init` & `.../verify`
  - `GET /passkey/mfa/status?userId=<id>`

- **Governança (Protegido por MFA)**:
  - `POST /governance/execute`

- **Admin de Segurança** (Requer header `x-admin-token`):
  - `POST /security/block-user`
  - `POST /security/unblock-user`
  - `POST /security/revoke-sessions`

- **Webhook de Risco** (Requer header `x-eliza-secret`):
  - `POST /security/risk/alert`

### 5.2. Funcionalidades de Segurança

- **Autenticação**: Login sem senha usando FIDO2 Passkeys (WebAuthn).
- **Sessões**: Tokens de sessão opacos armazenados no Redis com TTL. As sessões podem ser revogadas por usuário.
- **MFA**: Um mecanismo de Autenticação de Múltiplos Fatores de fallback usando uma assinatura de carteira Stellar. Um MFA bem-sucedido concede uma janela de recência de curta duração (~15 min) para operações críticas.
- **Autorização**: Controle de acesso baseado em função com guards dedicados para endpoints de administração (`AdminGuard`), operações críticas (`MfaGuard`) e webhooks de entrada (`ElizaGuard`).
- **HSM**: Um `HsmService` (stub) está implementado para futura integração com um Hardware Security Module para assinar operações críticas.

## 6. Integrações

### 6.1. ElizaOS

ElizaOS é um agente de IA usado para análise de risco em tempo real.

- **Configuração**: `tools/eliza/config.json`.
- **Comandos**:
  - `npm run eliza:agent:start`: Inicia o agente.
  - `npm run eliza:agent:chat`: Abre uma interface de chat com o agente.
- O backend recebe alertas de risco do ElizaOS através do webhook `/security/risk/alert` para automatizar respostas como bloquear um usuário ou revogar sessões.

### 6.2. Outros Serviços

A plataforma se integra com:
- **Celcoin**: Para PIX e outros serviços de pagamento.
- **Dock**: Para emissão e processamento de cartões.
- **Sumsub**: Para processos de KYC (Know Your Customer).

A comunicação segura com esses serviços é garantida através da verificação de webhooks com HMAC.

## 7. Solução de Problemas (Troubleshooting)

- **Falha na Conexão com o Redis**: O backend registrará um aviso e usará um armazenamento de sessão em memória (não adequado para produção). Garanta que `REDIS_URL` esteja configurado corretamente.
- **Falha no MFA**: Verifique a expiração do `nonce` ou problemas com a assinatura Stellar.
- **403 Forbidden em Admin/Webhook**: Verifique se os headers `x-admin-token` ou `x-eliza-secret` estão corretos.

## 8. Glossário

- **Passkey/WebAuthn**: Um padrão para autenticação sem senha usando criptografia de chave pública.
- **Recência de MFA**: Uma curta janela de tempo após uma verificação de MFA bem-sucedida, durante a qual um usuário pode realizar ações críticas sem se re-autenticar.
- **ElizaOS**: Um agente externo que monitora a atividade do usuário e emite alertas de risco.
- **HSM**: Hardware Security Module, um dispositivo físico para gerenciar chaves digitais de forma segura.
