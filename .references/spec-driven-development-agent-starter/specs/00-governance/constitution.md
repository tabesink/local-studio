---
id: GOV-001
title: Project Constitution
status: draft
owner: <team or role>
last_reviewed: <YYYY-MM-DD>
depends_on: []
supersedes: []
---

# Project Constitution

## Purpose

State the engineering and product principles that constrain every design decision in this repository.

## Non-negotiable principles

### 1. User outcome before implementation mechanism

Describe the desired outcome and acceptance criteria before choosing frameworks, libraries, models, providers, or infrastructure.

### 2. KISS — Keep It Simple

Prefer the smallest design that completely satisfies approved requirements. Favor explicit control flow, clear ownership, and standard platform features.

### 3. YAGNI — You Aren’t Gonna Need It

Do not build extension points, configuration, fallbacks, queues, services, or abstractions for hypothetical future needs. Document deferred ideas briefly only when their absence could confuse a maintainer.

### 4. DRY — One canonical rule

Each important business rule, model, calculation, contract, and decision must have one authoritative home. Link to it; do not restate it inconsistently.

### 5. Secure and private by default

Define data classification, authorization, audit, retention, and secret handling before processing sensitive or regulated information.

### 6. Observable behaviour

Important user actions, failures, background processing, and AI decisions must produce enough safe evidence to diagnose behaviour without exposing secrets or private data.

### 7. Contracts are products

Public APIs, events, persistent data schemas, and AI tool interfaces have consumers. Version and test them. Breaking change requires migration, parallel version, or explicit consumer coordination.

### 8. Tests are delivery evidence

Each acceptance criterion has an appropriate verification method: automated test, manual acceptance check, load/security test, migration rehearsal, or observable production signal.

## Required practices

- Branch/PR naming: `<feature-id>-short-name`.
- Each meaningful code change names a feature ID.
- Feature docs, code, tests, and traceability update together.
- Every approved exception to this constitution is recorded in an ADR or decision log with expiry/review date.

## Project-specific rules

> Replace this section with your actual stack, hosting, compliance, performance, UX, and deployment constraints.
