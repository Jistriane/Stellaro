# Zero-Knowledge Module

## Purpose

This module contains backend logic for generating, validating, and handling zero-knowledge proof workflows in Stellaro.

## Responsibilities

- Proof input preprocessing
- Proof generation orchestration
- Verification pipeline integration
- Error handling and traceability

## Security Notes

- Never log witness or secret inputs
- Validate proof artifacts before downstream usage
- Enforce strict schema checks on proof payloads

## Operational Notes

- Keep prover/verifier versions aligned with circuit artifacts
- Record proof metadata required for audit and debugging
