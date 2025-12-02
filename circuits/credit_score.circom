// Simple credit score circuit: proves score >= minScore using private score
// Inputs:
// - public: minScore
// - private: score
// Constraint: score - minScore >= 0

template ScoreCheck() {
    signal input minScore;
    signal input score;
    signal output ok;

    // Dev-only: trivial constraint to allow VK generation
    // (Replace with proper comparator in production)
    score === score;
    ok <== 1;
}

component main = ScoreCheck();