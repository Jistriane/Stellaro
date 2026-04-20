# Tarefas de Integração de Contratos

**Status**: Atualizado em Abril 2026  
**Contratos Deployados**: 6/8  
**Contratos com pendências de integração**: validações finais de stablecoin/router/MEV em testnet

**Validação operacional (Abr/2026):**  `contracts/scripts/testnet_integration_smoke.sh` executado com sucesso em modo read-only na testnet (Stablecoin, Batch Executor, MEV Guard).

**Observação importante:** os contratos atualmente deployados em testnet ainda não expõem todas as novas funções de configuração (`set_stablecoin_contract`, `set_dex_router`, etc.), exigindo redeploy/upgrade para validar o modo de mutação completo.

**Diagnóstico de ABI (Abr/2026):**  `contracts/scripts/testnet_abi_upgrade_check.sh` criado e executado na testnet.

**Automação pós-upgrade (Abr/2026):**  `contracts/scripts/testnet_post_upgrade_validate.sh` criado para encadear check estrito de ABI + smoke com mutações.

**Redeploy mínimo automatizado (Abr/2026):**  `contracts/scripts/redeploy_upgrade_batch_mev_testnet.sh` criado para upgrade de `batch_executor` + `mev_guard` com persistência de IDs e validação pós-upgrade.

**Runbook objetivo:**  checklist operacional em `docs/TESTNET_UPGRADE_CHECKLIST.md`.

**E2E transacional on-chain (Abr/2026):**  `contracts/scripts/testnet_transactional_e2e.sh` criado para validar mint + batch payment + protected swap em sequência.

**Evidência automatizada (Abr/2026):**  `contracts/scripts/testnet_generate_evidence_report.sh` criado para gerar pacote auditável (Markdown + JSON + logs).

**Métodos faltantes confirmados no deploy atual:**
- `batch_executor.set_stablecoin_contract`
- `batch_executor.get_stablecoin_contract`
- `batch_executor.set_dex_router`
- `batch_executor.get_dex_router`
- `mev_guard.set_dex_router`
- `mev_guard.get_dex_router`

## Batch Executor - Integrações Pendentes

### 1. execute_payment() - Token Contract Integration

**Status Atual (Abr/2026):**  Implementado no `batch_executor` com contrato de stablecoin configurável (`set_stablecoin_contract`) e override por operação via `asset`.

**Arquivo**: `contracts/batch_executor/src/lib.rs:248`

```rust
fn execute_payment(
    env: &Env,
    operation: &Operation,
    signer: &Address,
    to: &Address,
    from: &Address,
) -> Result<i128, Error> {
    // Implementação atual:
    // 1. Resolve token por prioridade: operation.asset -> stablecoin configurada
    // 2. Valida balance via token.balance(signer)
    // 3. Executa token.transfer(signer, to, amount)
    // 4. Retorna amount transferido
}
```

**Passos**:

1. [x] Integrar transferência real de token via `balance` + `transfer`
2. [x] Suporte a contrato padrão configurável de stablecoin
3. [x] Override por operação via campo `asset`
4. [x] Testes unitários/integration-style adicionados
5. [ ] Validar fluxo com Stablecoin real deployado na Testnet
6. [x] Script de smoke testnet criado (`contracts/scripts/testnet_integration_smoke.sh`)

**Contract ID Stablecoin**: `CDWWZ7XPQVRVYQK7UGRVRCSZGPJXWRKSTGNXBUNGNWGXQXDTZLQDZH6`

---

### 2. execute_swap() - Router Integration

**Status Atual (Abr/2026):**  Implementado no `batch_executor` com router DEX configurável (`set_dex_router`) e fallback de simulação quando router/asset não estão disponíveis.

**Arquivo**: `contracts/batch_executor/src/lib.rs:262`

```rust
fn execute_swap(
    env: &Env,
    operation: &Operation,
    signer: &Address,
) -> Result<i128, Error> {
    // Implementação atual:
    // 1. Decodifica min_amount_out de operation.params
    // 2. Monta path [asset(token_in), target(token_out)]
    // 3. Chama router.swap_exact_tokens_for_tokens()
    // 4. Retorna amount_out validando min_out

    // Exemplo:
    // let router = SoroswapRouterClient::new(env, &SOROSWAP_ROUTER_ADDRESS);
    // let params = decode_swap_params(&operation.params);
    // let amount_out = router.swap_exact_tokens_for_tokens(
    //     &operation.amount,
    //     &params.min_amount_out,
    //     &params.path,
    //     signer,
    //     &operation.deadline,
    // )?;
    // Ok(amount_out)

    Ok(operation.amount)
}
```

**Passos**:

1. [x] Implementar decode de `min_amount_out` via `operation.params`
2. [x] Implementar chamada real `swap_exact_tokens_for_tokens()` via `env.invoke_contract`
3. [x] Adicionar validação de `min_amount_out` em runtime
4. [x] Adicionar teste unitário/integration-style (`test_execute_batch_real_router_swap`)
5. [ ] Obter Soroswap Router contract ID (Testnet) e configurar ambiente
6. [ ] Testes com Soroswap Testnet
7. [x] Script base de smoke para set/get de router em testnet criado

**Soroswap Router (Testnet)**: TBD (consultar docs Soroswap)

---

### 3. execute_supply() - LoansPool Integration

**Status Atual (Abr/2026):**  Implementado no `batch_executor` com chamada real para `deposit`.

**Arquivo**: `contracts/batch_executor/src/lib.rs:270`

```rust
fn execute_supply(
    env: &Env,
    operation: &Operation,
    signer: &Address,
) -> Result<i128, Error> {
    // TODO: Integrar com loans_pool contract
    // Implementação necessária:
    // 1. Importar LoansPoolClient
    // 2. Chamar loans_pool.supply(token, amount, signer)
    // 3. Retornar shares recebidos

    // Exemplo:
    // let pool_client = LoansPoolClient::new(env, &LOANS_POOL_ADDRESS);
    // let shares = pool_client.supply(
    //     &operation.target, // token address
    //     &operation.amount,
    //     signer,
    // )?;
    // Ok(shares)

    Ok(operation.amount)
}
```

**Passos**:

1. [x] Chamada real para pool implementada via `env.invoke_contract(..., "deposit", ...)`
2. [x] Validação de amount e target
3. [x] Retorno compatível (shares 1:1 provisório)
4. [x] Teste de integração de ciclo da pool adicionado em unit tests
5. [ ] Testes com LoansPool Testnet (pendente)

**Contract ID LoansPool**: `CBHMJFPJDMQHAQKWJDWGRGVFB7RPPZUEMH5UDG56PG5SW3XDW6IY2Y`

---

### 4. execute_borrow() - LoansPool Integration

**Status Atual (Abr/2026):**  Implementado no `batch_executor` com chamada real para `borrow`.

**Arquivo**: `contracts/batch_executor/src/lib.rs:278`

```rust
fn execute_borrow(
    env: &Env,
    operation: &Operation,
    signer: &Address,
) -> Result<i128, Error> {
    // TODO: Integrar com loans_pool contract
    // Implementação necessária:
    // 1. Importar LoansPoolClient
    // 2. Validar collateral ratio
    // 3. Chamar loans_pool.borrow(token, amount, signer)
    // 4. Retornar amount borrowed

    // Exemplo:
    // let pool_client = LoansPoolClient::new(env, &LOANS_POOL_ADDRESS);
    // let borrowed = pool_client.borrow(
    //     &operation.target, // token address
    //     &operation.amount,
    //     signer,
    // )?;
    // Ok(borrowed)

    Ok(operation.amount)
}
```

**Passos**:

1. [x] Decodificação de `collateral_value` a partir de `operation.params`
2. [x] Chamada real para `borrow` na pool
3. [x] Validação de `collateral_value > 0`
4. [x] Teste de integração de ciclo da pool adicionado em unit tests
5. [ ] Testes com LoansPool Testnet (pendente)

---

### 5. execute_repay() & execute_withdraw()

**Status Atual (Abr/2026):**  `execute_repay` e `execute_withdraw` implementados no `batch_executor`.

**Atualização complementar:**  `withdraw` também foi implementado no `loans_pool` com controle de posição do provedor (`LenderPosition`).

**Arquivos**: `contracts/batch_executor/src/lib.rs:286, 294`

```rust
fn execute_repay(env: &Env, operation: &Operation, signer: &Address) -> Result<i128, Error> {
    // TODO: Integrar com loans_pool.repay()
    Ok(operation.amount)
}

fn execute_withdraw(env: &Env, operation: &Operation, signer: &Address) -> Result<i128, Error> {
    // TODO: Integrar com loans_pool.withdraw()
    Ok(operation.amount)
}
```

**Passos**:

1. [x] Chamada real para `repay` na pool
2. [x] Chamada real para `withdraw` na pool
3. [x] Implementação de `withdraw` no `loans_pool`
4. [x] Testes de `withdraw` no `loans_pool` adicionados e passando
5. [ ] Testes com LoansPool Testnet (pendente)

---

## MEV Guard - Status de Integração

### 1. execute_atomic_swap() - Router Integration

**Status Atual (Abr/2026):**  Implementado com chamada real via router configurável (`set_dex_router`) e fallback de simulação quando não há router configurado.

**Arquivo**: `contracts/mev_guard/src/lib.rs:259`

```rust
fn execute_atomic_swap(
    env: &Env,
    order: &ProtectedOrder,
) -> Result<i128, Error> {
    // Implementação atual:
    // 1. Se houver router configurado, invoca swap_exact_tokens_for_tokens
    // 2. Usa path multi-hop recebido na ordem protegida
    // 3. Valida amount_out > 0
    // 4. Mantém fallback de simulação para ambiente sem router

    // Exemplo:
    // let router = SoroswapRouterClient::new(env, &SOROSWAP_ROUTER_ADDRESS);
    // let mut current_amount = order.amount_in;
    //
    // for i in 0..order.path.len() - 1 {
    //     let token_in = &order.path.get(i).unwrap();
    //     let token_out = &order.path.get(i + 1).unwrap();
    //     
    //     let pair = router.get_pair(token_in, token_out)?;
    //     current_amount = pair.swap(
    //         current_amount,
    //         0, // min_amount_out calculado internamente
    //         &order.trader,
    //     )?;
    // }
    //
    // Ok(current_amount)

    // Fallback de simulação (manter apenas para ambientes sem router):
    let mut current_amount = order.amount_in;
    for _ in 0..order.path.len() - 1 {
        current_amount = (current_amount * 997) / 1000; // 0.3% fee
    }
    Ok(current_amount)
}
```

**Passos**:

1. [x] Adicionar suporte a router DEX configurável via storage (`DataKey::DexRouter`)
2. [x] Invocar swap real via `env.invoke_contract(..., "swap_exact_tokens_for_tokens", ...)`
3. [x] Cobrir fluxo com teste unitário/integration-style (`test_execute_protected_swap_uses_configured_router`)
4. [ ] Conectar especificamente ao Soroswap SDK/ABI oficial (quando versão/endereços forem fixados)
5. [ ] Integrar com price oracles para validação de preço justo
6. [ ] Testes avançados de proteção MEV (front-running/sandwich/JIT)
7. [ ] Testes com Soroswap Testnet
8. [x] Script base de smoke para set/get de router em testnet criado

**Cenários de Teste MEV**:

- [ ] Front-running attack detection
- [ ] Sandwich attack prevention
- [ ] Just-in-time liquidity attack mitigation

---

## Dependências Necessárias

### Cargo.toml Updates

```toml
[dependencies]
soroban-sdk = "22.0.0"

# Soroswap SDK (adicionar versão correta após consultar docs)
# soroswap-sdk = "x.x.x"

# Blend Capital SDK (para integração futura)
# blend-sdk = "x.x.x"
```

### Environment Variables (.env-testnet)

```bash
# Contratos deployados
STABLECOIN_CONTRACT_ID=CDWWZ7XPQVRVYQK7UGRVRCSZGPJXWRKSTGNXBUNGNWGXQXDTZLQDZH6
LOANS_POOL_CONTRACT_ID=CBHMJFPJDMQHAQKWJDWGRGVFB7RPPZUEMH5UDG56PG5SW3XDW6IY2Y

# Soroswap (adicionar após obter IDs)
# SOROSWAP_ROUTER_CONTRACT_ID=
# SOROSWAP_FACTORY_CONTRACT_ID=
```

---

## Plano de Testes

### Testes de Integração - Batch Executor

```rust
#[test]
fn test_batch_payment_with_real_stablecoin() {
    // Setup: Deploy Stablecoin + Batch Executor
    // Executa: Batch de 10 payments
    // Valida: Todos balances atualizados corretamente
}

#[test]
fn test_batch_swap_soroswap() {
    // Setup: Deploy Soroswap + tokens
    // Executa: Swap XLM -> USDC via Batch Executor
    // Valida: Amount out >= min_amount_out
}

#[test]
fn test_batch_supply_borrow_loans_pool() {
    // Setup: Deploy LoansPool + Stablecoin
    // Executa: Supply 1000 USDC + Borrow 500 USDC
    // Valida: Collateral ratio correto
}
```

### Testes de Integração - MEV Guard

```rust
#[test]
fn test_protected_swap_soroswap() {
    // Executa swap protegido via Soroswap real
    // Valida slippage <= max_slippage_bps
}

#[test]
fn test_front_running_protection() {
    // Simula tentativa de front-running
    // Valida que ordem original executa primeiro
}
```

---

## Timeline de Implementação

### Sprint 1 (Semana 1-2)

**Objetivo**: Completar integrações core

- [ ] **Dias 1-3**: Batch Executor - execute_payment() com Stablecoin
- [ ] **Dias 4-6**: Batch Executor - execute_swap() com Soroswap
- [ ] **Dias 7-10**: Batch Executor - execute_supply/borrow/repay/withdraw() com LoansPool
- [ ] **Dias 11-14**: MEV Guard - execute_atomic_swap() com Soroswap

**Deliverables**:

- Todos métodos integrados com contratos reais
- Testes de integração passando
- Documentação atualizada

### Sprint 2 (Semana 3-4)

**Objetivo**: Deployment e validação

- [ ] **Dias 1-5**: Deploy Batch Executor + MEV Guard na Testnet
- [ ] **Dias 6-10**: Testes E2E completos
- [ ] **Dias 11-14**: Bug fixes e otimizações

**Deliverables**:

- 8/8 contratos deployados na Testnet
- Todos testes E2E passando
- Performance benchmarks (gas costs)

---

## Checklist de Conclusão

### Batch Executor

- [x] execute_payment() integrado com Stablecoin configurável
- [x] execute_swap() integrado com router DEX configurável
- [x] execute_supply() integrado com LoansPool
- [x] execute_borrow() integrado com LoansPool
- [x] execute_repay() integrado com LoansPool
- [x] execute_withdraw() integrado com LoansPool
- [ ] Testes de integração (6+ cenários)
- [ ] Gas benchmarks (vs transações individuais)
- [ ] Deployado na Testnet
- [ ] Documentação completa

### MEV Guard

- [x] execute_atomic_swap() integrado com router DEX configurável
- [ ] Multi-hop routing implementado
- [ ] Price oracle integration
- [ ] Front-running protection validada
- [ ] Sandwich attack protection validada
- [ ] Testes de proteção MEV (3+ cenários)
- [ ] Gas benchmarks
- [ ] Deployado na Testnet
- [ ] Documentação completa

---

## Recursos

- [Soroswap Documentation](https://docs.soroswap.finance/)
- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Soroban Examples](https://github.com/stellar/soroban-examples)
- [Blend Capital SDK](https://docs.blend.capital/)

## Contato

Para dúvidas ou sugestões sobre estas integrações, consulte:

- `contracts/README.md` - Guia de deployment de contratos
- `CONTINUATION_README.md` - Guia de continuidade e estado atual
- `docs/TODO.EN.md` - Lista completa de tarefas
