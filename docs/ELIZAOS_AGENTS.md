# ElizaOS Agents

## Purpose

This document defines how ElizaOS-based agents are used in Stellaro for risk, telemetry, and operational automation.

## Core Agents

- Risk Guardian: protocol health and anomaly detection
- Notification Agent: event-driven alerts and escalation triggers
- Analytics Agent: telemetry enrichment and operational insights

## Integration Model

- Agents consume structured events from backend services
- Agent outcomes are written back to API-accessible channels
- Critical actions remain policy-gated by backend and contract controls

## Safety Rules

- No direct privileged mutation without explicit authorization path
- All automated decisions must be observable and auditable
- Fail-safe behavior on upstream or model unavailability

## Runtime Controls

- Feature flags per environment
- Alert thresholds configurable via environment settings
- Emergency disable switch for autonomous actions

## Operational Notes

- Agent behavior should be deterministic where possible
- Changes to agent policy require changelog entry and validation evidence
