# Circuit Optimization Guide

## Objective

Guidance for optimizing zero-knowledge circuits used by Stellaro.

## Best Practices

- Minimize constraints and avoid expensive arithmetic inside loops.
- Precompute constant values where possible and reuse them.
- Prefer lookup tables for repetitive operations.

## Build and Benchmark

- Use `circom` and `snarkjs` tools for local development and benchmarking.
- Record wtns and r1cs sizes to track improvements.

## Compatibility

Keep prover and verifier versions aligned with circuit artifacts and update the documentation when upgrading toolchains.
