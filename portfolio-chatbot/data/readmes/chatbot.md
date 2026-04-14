# Portfolio AI Chatbot Assistant — RAG + Debugging Intelligence System

## Overview

This portfolio includes a custom AI RAG chatbot assistant designed and implemented by Dave to allow recruiters and engineers to interactively explore his projects, technical decisions, and engineering systems.

The assistant retrieves verified portfolio documentation and generates responses strictly grounded in that context.

This is not a generic chatbot.

It is a **Retrieval-Augmented Generation (RAG) system enhanced with an AI Debugging Intelligence Layer**.

---

## Core Purpose

Traditional portfolios are static and require manual exploration.

This system allows users to:

- Ask technical questions interactively
- Understand engineering decisions and architecture
- Explore system behavior and debugging workflows
- Receive grounded, non-hallucinated answers

---

## Key Evolution (IMPORTANT)

The system has evolved from:

→ Documentation retrieval  

into:

→ **Engineering reasoning system**

It can now answer:

- Why did reliability drop?
- Is this latency spike meaningful?
- Which metric caused a regression?
- What should be investigated next?

---

# High-Level Architecture

User Question  
→ Edge API (Cloudflare Worker)  
→ Input Validation + Security Layer  
→ Vector Retrieval (Supabase)  
→ Context Assembly  
→ Language Model Generation  
→ Streaming Response  

---

# Core Components

## 1. Edge API (Cloudflare Workers)

Handles:

- request validation
- security enforcement
- retrieval orchestration
- response streaming

Benefits:

- low latency
- global distribution
- stateless execution

---

## 2. Vector Retrieval System

Documents are embedded and stored in a vector database.

Sources include:

- project READMEs
- engineering documentation
- system architecture files
- debugging playbooks
- metric definitions

Retrieval ensures responses are grounded in real content.

---

## 3. Language Model Layer

The model:

- receives structured context
- answers ONLY using retrieved chunks
- is restricted from using external knowledge

This prevents hallucination and ensures accuracy.

---

# AI Debugging Intelligence Layer (NEW)

## Purpose

To transform the system from:

→ answering questions  

into:

→ **explaining system behavior and guiding debugging**

---

## Components

### 1. Metric Formulas

Define how signals are computed:

- latency (P95)
- confidence
- reliability score
- release confidence
- rate limiting

---

### 2. Debugging Playbook

Maps:

→ symptom → root cause → investigation steps  

Example:

- Confidence drop → check retrieval quality
- Latency increase → inspect backend performance

---

### 3. Correlation Rules

Define relationships between signals:

Examples:

- latency ↑ + confidence ↓ → backend affecting retrieval
- confidence ↓ only → retrieval issue
- latency ↑ only → performance issue

---

## Result

The system can reason about:

- system degradation
- root causes
- engineering impact

---

# Observability Integration

The chatbot is tightly integrated with the AI Observability Dashboard.

---

## Signals Available

- Latency (performance)
- Confidence (retrieval quality)
- Reliability (system health)
- Release Confidence (deployment readiness)
- Rate limit enforcement
- Flakiness

---

## Core Pattern

All signals follow:

→ baseline vs actual  
→ deviation  
→ interpretation  

---

## Example Reasoning

Instead of:

"Latency is high"

The system answers:

"Latency increased +7.8% vs baseline and is entering degraded range — monitor backend performance."

---

# Retrieval System Design

The ingestion pipeline ensures high-quality retrieval:

- deterministic chunking
- SHA-256 hashing
- idempotent ingestion
- metadata enrichment

---

## Context Builder

Ensures:

- deterministic truncation
- coherent technical context
- prioritization of high-value information

---

# Security & Guardrails

The system enforces strict safety:

- prompt injection detection
- input validation
- context-only responses
- origin validation (CORS)
- user-agent filtering

---

## Early Request Filtering

- invalid user-agents rejected early
- reduces system load
- improves reliability

---

# Deployment Security

- SSH-secured infrastructure communication
- GitHub Secrets for credential management
- no sensitive data exposed in code

---

# Privacy Design

The system does NOT store:

- personal identifiers
- user accounts
- sensitive user data

Logs are used only for:

- debugging
- system improvement

---

# AI Testing & Reliability Engineering

The system includes a comprehensive testing strategy:

---

## Testing Layers

- unit testing
- security validation
- end-to-end testing
- retrieval regression testing
- performance benchmarking
- rate-limit validation

---

## Weekly Regression Suite

Validates:

- latency trends
- retrieval quality
- concurrency behavior
- rate limit correctness

---

## Key Principle

AI systems are treated as:

→ **reliable software infrastructure**

not experimental systems.

---

# CI/CD Strategy

## 1. Pull Request Gate

- unit tests
- API validation
- E2E (Chromium)
- performance checks

---

## 2. Deployment Pipeline

- cross-browser testing
- artifact generation
- deployment gating

---

## 3. Weekly Regression

- performance testing
- retrieval validation
- rate limit verification

---

# Engineering Design Decisions

- strict context-only generation (prevents hallucination)
- deterministic context assembly
- separation of ingestion vs inference
- streaming responses
- edge execution for performance

---

# Skills Demonstrated

- RAG system design
- AI observability systems
- backend API engineering
- edge computing
- vector databases
- AI security and guardrails
- performance optimization
- automated testing systems

---

# Outcome

The result is an intelligent assistant that:

- explains engineering decisions
- analyzes system behavior
- guides debugging
- demonstrates real-world AI system design

---

# Key Insight

This system represents a shift from:

→ static documentation  

to:

→ **interactive engineering intelligence**

It enables users to explore not just:

→ what was built  

but:

→ how it works  
→ why decisions were made  
→ how issues are diagnosed  