# Agents Overview

## Purpose

This folder contains autonomous agents used for risk, notifications, analytics and other operational automation.

## Getting Started

- Agents expose HTTP endpoints and consume event streams.
- Configure environment variables in `.env` for local development.
- Use the agents' API docs for integration points.

## Running Locally

1. Install dependencies in the `agents` folder.
2. Configure `NEXT_PUBLIC_API_URL` and authentication variables.
3. Run `python api_server.py` or the dev entrypoint documented per-agent.

## Security

Agents must never expose secrets in logs and all privileged actions must be approved by a backend policy gate.
