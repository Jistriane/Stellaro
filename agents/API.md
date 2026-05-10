# Agents API Reference

## Purpose

This reference describes the public and internal API surface used by Stellaro agents.

## Endpoint Categories

- Health and status endpoints
- Event ingestion endpoints
- Decision output endpoints
- Administrative control endpoints

## Request Requirements

- Authenticated requests for all non-public endpoints
- Structured payload validation
- Correlation ID support for tracing

## Response Standards

- Deterministic status codes
- Structured JSON error envelopes
- Machine-readable error codes

## Security

- Role-based permission checks
- Rate limiting and abuse controls
- No secret exposure in responses or logs

## Versioning

Breaking changes require version increment and migration notes.
