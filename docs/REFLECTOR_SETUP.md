# Reflector Setup Guide

## Overview

Reflector services synchronize and expose required chain and operational data for Stellaro components.

## Setup Requirements

- Valid network endpoint configuration
- Access to required credentials/secrets
- Storage path for snapshots and checkpoint state

## Configuration

Define:
- network and provider endpoints
- polling intervals and timeout thresholds
- retry behavior and backoff limits
- output channels for downstream services

## Startup Procedure

1. Load environment profile.
2. Validate endpoint connectivity.
3. Start reflector process.
4. Confirm initial sync completion.

## Observability

Monitor:
- sync lag
- ingestion errors
- processing throughput
- checkpoint consistency

## Failure Handling

- Retry transient failures with bounded attempts.
- Escalate persistent failures through alerting channel.
- Preserve last valid checkpoint for safe recovery.
