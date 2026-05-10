# Circuits Integration Guide

## Purpose

Instructions to integrate zero-knowledge circuits with backend verification pipelines.

## Steps

1. Build the circuit and generate proof artifacts.
2. Publish verifier artifacts to the verification service.
3. Implement API endpoints that accept proof payloads and validate them against verification keys.

## Tools

- `circom`, `snarkjs`, and project-specific tooling.
- CI should run circuit builds and verification tests on change.
