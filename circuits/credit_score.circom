pragma circom 2.0.0;

include "circomlib/comparators.circom";
include "circomlib/gates.circom";

/*
 * Credit Score Circuit - Groth16 ZK Proof
 * 
 * Prova que um usuário tem score >= minScore sem revelar:
 * - Histórico de transações
 * - Saldo atual
 * - Dados pessoais
 * 
 * Public Inputs:
 *   - minScore: score mínimo requerido (300-850)
 *   - timestamp: timestamp da prova
 * 
 * Private Inputs:
 *   - actualScore: score real do usuário
 *   - txCount: número de transações
 *   - avgRepaymentTime: tempo médio de pagamento (dias)
 *   - liquidityProvided: liquidez fornecida (normalized)
 *   - salt: random salt para privacidade
 */

template CreditScoreProof() {
    // Public inputs
    signal input minScore;
    signal input timestamp;
    
    // Private inputs (sensíveis)
    signal input actualScore;
    signal input txCount;
    signal input avgRepaymentTime;
    signal input liquidityProvided;
    signal input salt;
    
    // Output
    signal output isValid;
    
    // Constraints
    
    // 1. Score range validation (300-850 FICO-like)
    component scoreInRange = AND();
    component scoreGte300 = GreaterEqThan(10);
    component scoreLte850 = LessEqThan(10);
    
    scoreGte300.in[0] <== actualScore;
    scoreGte300.in[1] <== 300;
    
    scoreLte850.in[0] <== actualScore;
    scoreLte850.in[1] <== 850;
    
    scoreInRange.a <== scoreGte300.out;
    scoreInRange.b <== scoreLte850.out;
    scoreInRange.out === 1; // Score deve estar no range válido
    
    // 2. Main constraint: actualScore >= minScore
    component scoreCheck = GreaterEqThan(10);
    scoreCheck.in[0] <== actualScore;
    scoreCheck.in[1] <== minScore;
    
    // 3. Transaction count validation (mínimo 10 txs)
    component txCountCheck = GreaterEqThan(10);
    txCountCheck.in[0] <== txCount;
    txCountCheck.in[1] <== 10;
    
    // 4. Avg repayment time check (< 30 dias = bom)
    component repaymentCheck = LessEqThan(10);
    repaymentCheck.in[0] <== avgRepaymentTime;
    repaymentCheck.in[1] <== 30;
    
    // 5. Liquidity check (deve ter fornecido alguma liquidez)
    component liquidityCheck = GreaterThan(10);
    liquidityCheck.in[0] <== liquidityProvided;
    liquidityCheck.in[1] <== 0;
    
    // 6. Timestamp validation (não muito antigo - max 24h = 86400s)
    // Assumindo que timestamp é UNIX timestamp
    // Em produção, comparar com ledger timestamp no contrato
    
    // 7. Combina todas as verificações
    component allChecks = AND();
    component check1 = AND();
    component check2 = AND();
    
    check1.a <== scoreCheck.out;
    check1.b <== txCountCheck.out;
    
    check2.a <== repaymentCheck.out;
    check2.b <== liquidityCheck.out;
    
    allChecks.a <== check1.out;
    allChecks.b <== check2.out;
    
    // Output final
    isValid <== allChecks.out;
    
    // Constraint: isValid deve ser 1 para prova válida
    isValid === 1;
    
    // Salt usage (para privacidade - força diferentes proofs para mesmos inputs)
    signal saltSquared;
    saltSquared <== salt * salt;
    // Salt é usado mas não afeta o resultado (privacidade)
}

component main {public [minScore, timestamp]} = CreditScoreProof();
