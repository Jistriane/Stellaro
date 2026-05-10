# API and SDK Specification

## Overview

This document summarizes Stellaro's API and SDK expectations for internal and partner integrations.

## API Principles

- Versioned endpoints
- Stable response contracts
- Structured error payloads
- Authentication and authorization enforcement

## SDK Goals

- Typed request/response models
- Deterministic signing flows
- Clear network/profile configuration
- Safe retry and timeout defaults

## Required Endpoint Groups

- Authentication
- Wallet and account management
- Risk and compliance
- Payments and subscriptions
- Governance and proposal actions
- Analytics and telemetry

## Error Model

Responses should include:
- machine-readable code
- user-readable message
- optional details/context
- request correlation id

## Security Requirements

- No secret material in client logs
- Signed calls for privileged actions
- Strict validation on all public inputs

## Compatibility Policy

Breaking API changes require version bump and migration notes.
