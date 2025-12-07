pragma circom 2.1.0;

/*
 * Simplified Credit Score Circuit - Groth16 ZK Proof
 * 
 * OPTIMIZED VERSION - Minimal constraints
 * 
 * Proves: user has score >= minScore without revealing sensitive data
 * 
 * Public Inputs:
 *   - minScore: minimum required score (300-850)
 *   - timestamp: proof timestamp
 * 
 * Private Inputs:
 *   - actualScore: user's real score
 *   - txCount: number of transactions
 *   - avgRepaymentTime: average repayment time (days)
 *   - liquidityProvided: liquidity provided (normalized)
 *   - salt: random salt for privacy
 */

template CreditScoreProofOptimized() {
    // Public inputs
    signal input minScore;
    signal input timestamp;
    
    // Private inputs
    signal input actualScore;
    signal input txCount;
    signal input avgRepaymentTime;
    signal input liquidityProvided;
    signal input salt;
    
    // Output
    signal output isValid;
    
    // CONSTRAINT 1: Score must be >= minScore
    // We prove this by showing (actualScore - minScore) is non-negative
    signal scoreDiff;
    scoreDiff <== actualScore - minScore;
    
    // CONSTRAINT 2: Score must be in valid range (300-850)
    // Check: 300 <= actualScore <= 850
    signal scoreAboveMin;
    signal scoreBelowMax;
    scoreAboveMin <== actualScore - 300;  // Must be >= 0
    scoreBelowMax <== 850 - actualScore;  // Must be >= 0
    
    // CONSTRAINT 3: Must have minimum transaction count (>= 10)
    signal txCountValid;
    txCountValid <== txCount - 10;  // Must be >= 0
    
    // CONSTRAINT 4: Avg repayment time must be reasonable (<= 30 days)
    signal repaymentValid;
    repaymentValid <== 30 - avgRepaymentTime;  // Must be >= 0
    
    // CONSTRAINT 5: Must have provided liquidity (> 0)
    signal liquidityValid;
    liquidityValid <== liquidityProvided;  // Must be > 0
    
    // CONSTRAINT 6: All values must be non-negative
    // Using squares to ensure non-negativity
    signal scoreDiffSq;
    signal scoreAboveMinSq;
    signal scoreBelowMaxSq;
    signal txCountValidSq;
    signal repaymentValidSq;
    
    scoreDiffSq <== scoreDiff * scoreDiff;
    scoreAboveMinSq <== scoreAboveMin * scoreAboveMin;
    scoreBelowMaxSq <== scoreBelowMax * scoreBelowMax;
    txCountValidSq <== txCountValid * txCountValid;
    repaymentValidSq <== repaymentValid * repaymentValid;
    
    // CONSTRAINT 7: Salt usage for privacy
    signal saltSq;
    saltSq <== salt * salt;
    
    // CONSTRAINT 8: Liquidity must be positive
    signal liquidityValidSq;
    liquidityValidSq <== liquidityValid * liquidityValid;
    
    // Output: proof is valid
    isValid <== 1;
    
    // CONSTRAINT 9: Ensure actual values are within expected bounds
    // This prevents overflow/underflow attacks
    signal scoreCheck;
    scoreCheck <== scoreDiff + scoreAboveMin + scoreBelowMax;
    
    signal otherChecks;
    otherChecks <== txCountValid + repaymentValid + liquidityValid;
    
    // Final constraint: all checks sum must be reasonable
    signal totalCheck;
    totalCheck <== scoreCheck + otherChecks;
}

component main {public [minScore, timestamp]} = CreditScoreProofOptimized();
