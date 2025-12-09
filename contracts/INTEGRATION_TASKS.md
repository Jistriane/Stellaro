# 🔗 Tarefas de Integração de Contratos

**Status**: Janeiro 2025  
**Contratos Deployados**: 6/8  
**Contratos Pendentes**: 2 (Batch Executor, MEV Guard)

## 📋 Batch Executor - Integrações Pendentes

### 1. execute_payment() - Token Contract Integration

**Arquivo**: `contracts/batch_executor/src/lib.rs:248`

```rust
fn execute_payment(
    env: &Env,
    operation: &Operation,
    signer: &Address,
    to: &Address,
    from: &Address,
) -> Result<i128, Error> {
    if operation.amount <= 0 {
        return Err(Error::InvalidOperation);
    }

    // TODO: Integrar com token contract real
    // Implementação necessária:
    // 1. Importar StablecoinClient ou TokenClient
    // 2. Chamar token.transfer(from, to, amount)
    // 3. Validar balance antes da transferência
    // 4. Retornar amount transferido ou erro

    // Exemplo:
    // let token_client = StablecoinClient::new(env, &operation.target);
    // token_client.transfer(from, to, &operation.amount)?;

    Ok(operation.amount)
}
```

**Passos**:

1. [ ] Importar `StablecoinClient` do contrato Stablecoin deployado
2. [ ] Obter contract ID do Stablecoin do environment (.env-testnet)
3. [ ] Implementar validação de balance
4. [ ] Implementar chamada `transfer()`
5. [ ] Adicionar testes de integração
6. [ ] Testar com Stablecoin deployado na Testnet

**Contract ID Stablecoin**: `CDWWZ7XPQVRVYQK7UGRVRCSZGPJXWRKSTGNXBUNGNWGXQXDTZLQDZH6`

---

### 2. execute_swap() - Soroswap Integration

**Arquivo**: `contracts/batch_executor/src/lib.rs:262`

```rust
fn execute_swap(
    env: &Env,
    operation: &Operation,
    signer: &Address,
) -> Result<i128, Error> {
    // TODO: Integrar com Soroswap
    // Implementação necessária:
    // 1. Importar SoroswapRouter SDK
    // 2. Decodificar params para obter: token_in, token_out, min_amount_out
    // 3. Chamar router.swap_exact_tokens_for_tokens()
    // 4. Retornar amount_out recebido

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

1. [ ] Adicionar dependência Soroswap SDK no Cargo.toml
2. [ ] Obter Soroswap Router contract ID (Testnet)
3. [ ] Implementar `decode_swap_params()` helper
4. [ ] Implementar chamada `swap_exact_tokens_for_tokens()`
5. [ ] Adicionar validação de slippage
6. [ ] Testes com Soroswap Testnet

**Soroswap Router (Testnet)**: TBD (consultar docs Soroswap)

---

### 3. execute_supply() - LoansPool Integration

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

1. [ ] Importar `LoansPoolClient` do contrato LoansPool
2. [ ] Usar contract ID deployado: `CBHMJ...IY2Y`
3. [ ] Implementar chamada `supply()`
4. [ ] Retornar LP tokens (shares) recebidos
5. [ ] Testes de integração com LoansPool Testnet

**Contract ID LoansPool**: `CBHMJFPJDMQHAQKWJDWGRGVFB7RPPZUEMH5UDG56PG5SW3XDW6IY2Y`

---

### 4. execute_borrow() - LoansPool Integration

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

**Passos**: Similar a `execute_supply()` + validação de collateral

---

### 5. execute_repay() & execute_withdraw()

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

**Passos**: Similar às anteriores, usando métodos `repay()` e `withdraw()` do LoansPool

---

## 🛡️ MEV Guard - Integrações Pendentes

### 1. execute_atomic_swap() - Soroswap Integration

**Arquivo**: `contracts/mev_guard/src/lib.rs:259`

```rust
fn execute_atomic_swap(
    env: &Env,
    order: &ProtectedOrder,
) -> Result<i128, Error> {
    // TODO: Integrar com DEX real (Soroswap)
    // Implementação necessária:
    // 1. Importar SoroswapRouter
    // 2. Implementar multi-hop swap routing
    // 3. Calcular amount_out real (não simulado)
    // 4. Aplicar proteção MEV (reentrancy guard já existe)

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

    // SIMULAÇÃO ATUAL (remover após integração):
    let mut current_amount = order.amount_in;
    for _ in 0..order.path.len() - 1 {
        current_amount = (current_amount * 997) / 1000; // 0.3% fee
    }
    Ok(current_amount)
}
```

**Passos**:

1. [ ] Adicionar Soroswap SDK no Cargo.toml
2. [ ] Implementar `get_pair()` para cada hop
3. [ ] Implementar swap atomico com slippage protection
4. [ ] Integrar com price oracles para validação de preço justo
5. [ ] Testes de proteção MEV (front-running scenarios)
6. [ ] Testes com Soroswap Testnet

**Cenários de Teste MEV**:

- [ ] Front-running attack detection
- [ ] Sandwich attack prevention
- [ ] Just-in-time liquidity attack mitigation

---

## 📦 Dependências Necessárias

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

## 🧪 Plano de Testes

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

## 📅 Timeline de Implementação

### Sprint 1 (Semana 1-2)

**Objetivo**: Completar integrações core

- [ ] **Dias 1-3**: Batch Executor - execute_payment() com Stablecoin
- [ ] **Dias 4-6**: Batch Executor - execute_swap() com Soroswap
- [ ] **Dias 7-10**: Batch Executor - execute_supply/borrow/repay/withdraw() com LoansPool
- [ ] **Dias 11-14**: MEV Guard - execute_atomic_swap() com Soroswap

**Deliverables**:

- ✅ Todos métodos integrados com contratos reais
- ✅ Testes de integração passando
- ✅ Documentação atualizada

### Sprint 2 (Semana 3-4)

**Objetivo**: Deployment e validação

- [ ] **Dias 1-5**: Deploy Batch Executor + MEV Guard na Testnet
- [ ] **Dias 6-10**: Testes E2E completos
- [ ] **Dias 11-14**: Bug fixes e otimizações

**Deliverables**:

- ✅ 8/8 contratos deployados na Testnet
- ✅ Todos testes E2E passando
- ✅ Performance benchmarks (gas costs)

---

## ✅ Checklist de Conclusão

### Batch Executor

- [ ] execute_payment() integrado com Stablecoin
- [ ] execute_swap() integrado com Soroswap
- [ ] execute_supply() integrado com LoansPool
- [ ] execute_borrow() integrado com LoansPool
- [ ] execute_repay() integrado com LoansPool
- [ ] execute_withdraw() integrado com LoansPool
- [ ] Testes de integração (6+ cenários)
- [ ] Gas benchmarks (vs transações individuais)
- [ ] Deployado na Testnet
- [ ] Documentação completa

### MEV Guard

- [ ] execute_atomic_swap() integrado com Soroswap
- [ ] Multi-hop routing implementado
- [ ] Price oracle integration
- [ ] Front-running protection validada
- [ ] Sandwich attack protection validada
- [ ] Testes de proteção MEV (3+ cenários)
- [ ] Gas benchmarks
- [ ] Deployado na Testnet
- [ ] Documentação completa

---

## 📚 Recursos

- [Soroswap Documentation](https://docs.soroswap.finance/)
- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Soroban Examples](https://github.com/stellar/soroban-examples)
- [Blend Capital SDK](https://docs.blend.capital/)

## 🤝 Contato

Para dúvidas ou sugestões sobre estas integrações, consulte:

- `contracts/README.md` - Guia de deployment de contratos
- `docs/QUICK_START.md` - Guia de início rápido
- `docs/TODO.EN.md` - Lista completa de tarefas
