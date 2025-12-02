# ZK Module - Zero-Knowledge Proof Verification

Este módulo implementa verificação de provas ZK Groth16 via smart contract Soroban na rede Stellar.

## 📋 Visão Geral

O módulo ZK permite que aplicações verifiquem provas de conhecimento-zero (ZK) para credit scoring sem revelar dados sensíveis dos usuários. A verificação é feita on-chain através do contrato `ZK Verifier` implantado na Stellar Testnet.

## 🏗️ Arquitetura

```
┌─────────────┐      HTTP       ┌──────────────┐    Soroban RPC    ┌─────────────────┐
│   Cliente   │ ──────────────> │  ZkService   │ ────────────────> │  ZK Verifier    │
│  (Frontend) │  POST /zk/verify│   (Backend)  │   verify_proof()  │   (Contrato)    │
└─────────────┘                 └──────────────┘                   └─────────────────┘
                                        │
                                        │ GET /zk/score/:address
                                        v
                                 ┌──────────────┐
                                 │  get_score() │
                                 └──────────────┘
```

## 🔌 Endpoints

### POST `/zk/verify`
Verifica uma prova Groth16 e armazena o credit score on-chain (se válido).

**Request Body:**
```typescript
{
  "proof": "01020304...",           // Hex string (512 chars = 256 bytes)
  "publicInputs": "05060708...",    // Hex string (256 chars = 128 bytes)
  "score": 750,                     // u32 (pontuação atestada)
  "nonce": "090a0b0c0d0e0f10...",   // Hex string (32 chars = 16 bytes)
  "expiresAt": 1701518400000,       // Epoch ms
  "userAddress": "GDHIZ..."         // Opcional: Stellar address
}
```

**Response:**
```typescript
{
  "ok": true,                       // Verificação bem-sucedida
  "reason": null                    // Ou string com erro se ok=false
}
```

**Possíveis erros** (`reason`):
- `expired`: Prova expirada
- `missing-contract-id`: Contrato não configurado
- `invalid-score`: Score negativo
- `missing-nonce`: Nonce ausente
- `missing-proof`: Proof ausente
- `missing-public-inputs`: Public inputs ausentes
- `proof-invalid-length`: Proof não tem 256 bytes
- `public-inputs-invalid-length`: Public inputs não tem 128 bytes
- `nonce-invalid-length`: Nonce não tem 16 bytes
- `simulation-failed`: Falha na simulação RPC
- `verification-failed`: Verificação on-chain falhou
- `internal-error`: Erro interno do servidor

### GET `/zk/score/:address`
Recupera o credit score de um usuário armazenado no contrato.

**Path Params:**
- `address`: Endereço Stellar do usuário (G...)

**Response:**
```typescript
{
  "score": 750,                     // Pontuação (ou null se não existe)
  "error": null                     // Ou string com erro
}
```

## ⚙️ Configuração

Adicione as seguintes variáveis no `.env`:

```bash
# Contrato ZK Verifier na Testnet
ZK_VERIFIER_CONTRACT_ID=CDJX3YLVANLTRRMMWDJO6NG7ADKJIHPL3WJAZNMNL6BQU6S6D5QXBT3L

# RPC da Stellar (opcional, usa default se não definido)
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Rede Stellar (testnet ou public)
STELLAR_NETWORK=testnet
```

## 🔐 Smart Contract

O contrato `ZK Verifier` expõe as seguintes funções:

### `verify_proof`
```rust
fn verify_proof(
    env: Env,
    user: Address,
    proof: BytesN<256>,
    public_inputs: BytesN<128>,
    nonce: BytesN<16>
) -> Result<CreditScore, Error>
```

Verifica uma prova Groth16 e armazena o score se válida.

**Retorna:**
```rust
struct CreditScore {
    score: u32,
    verified_at: u64,
    expires_at: u64,
    proof_nonce: ProofNonce,
}
```

### `get_score`
```rust
fn get_score(env: Env, user: Address) -> Option<CreditScore>
```

Recupera o score de um usuário (se existir e não expirou).

### `is_creditworthy`
```rust
fn is_creditworthy(env: Env, user: Address) -> bool
```

Verifica se o usuário tem score válido acima do mínimo.

## 🧪 Testes

Execute os testes unitários:

```bash
npm test -- zk.service.spec.ts
```

**Cobertura:**
- ✅ Rejeita proofs expirados
- ✅ Rejeita score inválido
- ✅ Rejeita nonce ausente
- ✅ Rejeita proof ausente
- ✅ Rejeita proof com tamanho inválido
- ✅ Retorna erro quando contrato não configurado
- ✅ Trata endereços válidos

## 📦 Dependências

- `@stellar/stellar-sdk` v14.4.0 - SDK Stellar para Soroban RPC
- `@nestjs/config` - Gerenciamento de configuração

## 🔄 Fluxo de Verificação

1. **Cliente** gera prova Groth16 localmente usando circuit ZK
2. **Cliente** envia proof + public inputs + metadata para `/zk/verify`
3. **Backend** valida formato e expiração
4. **Backend** invoca `verify_proof` no contrato via Soroban RPC (simulação)
5. **Contrato** verifica a prova usando Groth16 pairing check
6. **Contrato** armazena o CreditScore se válido
7. **Backend** retorna resultado para o cliente

## 🚀 Próximos Passos

### Week 3-4
- [ ] Integrar circuito Groth16 real (substituir stub)
- [ ] Gerar provas do lado do cliente (browser + wasm)
- [ ] Implementar prover service (snarkjs)
- [ ] Adicionar cache Redis para scores

### Futuro
- [ ] Suporte a batch verification (múltiplas proofs)
- [ ] Renovação automática de proofs próximas da expiração
- [ ] Métricas e monitoramento de verificações
- [ ] Rate limiting por usuário/IP

## 📚 Referências

- [Groth16 Paper](https://eprint.iacr.org/2016/260.pdf)
- [Stellar SDK Docs](https://stellar.github.io/js-stellar-sdk/)
- [Soroban RPC API](https://soroban.stellar.org/api/methods)
- [snarkjs](https://github.com/iden3/snarkjs)
- [Circom](https://docs.circom.io/)

## 🔗 Links Úteis

- **Contrato Explorer**: https://stellar.expert/explorer/testnet/contract/CDJX3YLVANLTRRMMWDJO6NG7ADKJIHPL3WJAZNMNL6BQU6S6D5QXBT3L
- **Init Transaction**: https://stellar.expert/explorer/testnet/tx/9a6dea7e48df2c7447a47a804b4cb77aa5b70cdb8762904787db7a9d2e6395f0
- **Contract Source**: `contracts/zk_verifier/src/lib.rs`
- **Initialization Script**: `tools/zk/init_contract_sdk.ts`

---

**Status**: ✅ Integrado e testado na Testnet  
**Contract ID**: `CDJX3YLVANLTRRMMWDJO6NG7ADKJIHPL3WJAZNMNL6BQU6S6D5QXBT3L`  
**Last Updated**: 2025-12-02
