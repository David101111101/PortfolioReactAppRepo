# Portfolio AI Chatbot Assistant — Self-Aware RAG + Debugging Intelligence System

## Overview

This portfolio includes a custom AI RAG chatbot assistant designed and implemented by Dave to allow recruiters and engineers to interactively explore his projects, technical decisions, and engineering systems.

The assistant retrieves verified portfolio documentation and generates responses strictly grounded in that context.

This is not a generic chatbot.

It is a **Retrieval-Augmented Generation (RAG) system enhanced with an AI Debugging Intelligence Layer and historical observability integration**.

---

## Core Purpose

Traditional portfolios are static and require manual exploration.

This system allows users to:

- Ask technical questions interactively
- Understand engineering decisions and architecture
- Explore system behavior and debugging workflows
- Receive grounded, non-hallucinated answers
- Analyze historical production run data from the observability dashboard

---

## Key Evolution (IMPORTANT)

The system has evolved from:

→ Documentation retrieval

into:

→ **Self-aware engineering intelligence system**

It can now answer:

- Why did reliability drop?
- Is this latency spike meaningful?
- Which metric caused a regression?
- What should be investigated next?
- What changed between this run and the previous one?

---

# Two Operating Modes (VERY IMPORTANT)

This chatbot operates in two distinct modes depending on where it is opened.

---

## MODE 1 — GENERAL (HOME PAGE)

**Trigger:** No run data is present in the context.

**Behavior:**

- Use architectural knowledge of this system to explain:
  - system design and component roles
  - metric formulas and how signals are computed
  - debugging playbooks and root cause patterns
  - correlation rules between metrics
- Focus on: "how the system works" and "what usually causes X"
- Do NOT fabricate specific run values
- If asked about specific run values, say you cannot confirm them without run data, then reason based on system behavior
- Keep answers concise (4–6 sentences for most questions)
- Avoid long enumerations unless explicitly requested

**Example questions answered in Mode 1:**

- "How does the reliability score work?"
- "What causes confidence to drop?"
- "Explain the rate limiting system"
- "How does RAG retrieval work in this system?"

---

## MODE 2 — ANALYSIS (DASHBOARD PAGE)

**Trigger:** The context includes a block beginning with `=== RUN ANALYSIS CONTEXT ===`

**Behavior:**

- You MUST use the provided run data
- Reference actual values from the snapshot
- Compare CURRENT vs PREVIOUS run using the deltas provided
- Explain what the changes mean (direction, magnitude, interpretation)
- Identify likely root causes using correlation rules
- Suggest what should be investigated next
- If PREVIOUS RUN is "Not available", analyze the current run standalone and note it is the earliest recorded run
- When asked about a single metric, focus the reasoning on that metric — do not enumerate all metrics unless explicitly asked

**Required reasoning structure for Dashboard Mode:**

1. Direct answer to the question
2. Data reference (actual values from the snapshot)
3. Change analysis (delta vs previous run)
4. Interpretation (what the change means)
5. Correlation (connect related signals: latency, confidence, reliability, rate limiting)
6. Actionable guidance (what to check next)

**Example questions answered in Mode 2:**

- "What happened to reliability in this run?"
- "Is this latency spike a concern?"
- "Which metric changed the most?"
- "Did confidence improve or degrade compared to the last run?"
- "What should I investigate based on these numbers?"

---

# Run Snapshot Structure (Dashboard Mode)

When a run is selected on the Dashboard, the following data is injected into the context:

**Current Run:**
- Run ID and timestamp
- P95 Latency (milliseconds — lower is better)
- Reliability Score (0–100 — higher is better)
- Avg Confidence (0–100 — higher is better)
- Min Confidence (0–100 — worst-case retrieval quality)
- Enforcement Rate (percentage — rate limiting activity)
- Avg Rank Shift (rank positions — lower = more stable retrieval ordering)

**Previous Run (if available):**
- Same fields as current run

**Deltas (current − previous):**
- P95 Latency delta in ms and percentage
- Reliability Score delta
- Avg Confidence delta
- Min Confidence delta
- Enforcement Rate delta
- Avg Rank Shift delta

---

# High-Level Architecture

User Question
→ Edge API (Cloudflare Worker)
→ Input Validation + Security Layer
→ Vector Retrieval (Supabase)
→ Context Assembly (documentation + optional run snapshot)
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

- receives structured context (documentation chunks + optional run snapshot)
- answers ONLY using retrieved chunks and injected run data
- is restricted from using external knowledge

This prevents hallucination and ensures accuracy.

---

# AI Debugging Intelligence Layer

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
- confidence (avg and min)
- reliability score: pass_rate × 0.7 + (1 − flaky_rate) × 0.2 + all_passed_bonus × 0.1
- release confidence
- rate limiting enforcement rate

---

### 2. Debugging Playbook

Maps:

→ symptom → root cause → investigation steps

Examples:

- Confidence drop → check retrieval quality, inspect vector similarity scores
- Latency increase → inspect backend performance, embedding generation time
- Reliability drop → check pass rate and flakiness independently

---

### 3. Correlation Rules

Define relationships between signals:

- latency ↑ + confidence ↓ → backend is affecting retrieval quality
- confidence ↓ only → retrieval issue, not performance
- latency ↑ only → performance issue, retrieval unaffected
- min_confidence ↓ while avg_confidence stable → single language or edge case degrading
- enforcement_rate deviation → rate limiting misconfiguration or traffic spike

---

# Observability Integration

The chatbot is tightly integrated with the AI Observability Dashboard.

The Dashboard runs weekly regression tests and stores results in Supabase. When a user selects a run on the Dashboard page, the chatbot receives a structured snapshot of that run and can reason about the data directly.

This creates a closed loop: the same system that detects regressions also explains them.

---

## Signals Available

- Latency (P95 performance)
- Confidence (retrieval quality — avg and min)
- Reliability Score (weighted system health)
- Release Confidence (deployment readiness)
- Enforcement Rate (rate limit correctness)
- Flakiness (test stability)
- Avg Rank Shift (retrieval ordering stability)

---

## Core Pattern

All signals follow:

→ baseline vs actual
→ deviation
→ interpretation

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
- run snapshot prepended when available (Dashboard mode)

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

Results are ingested into Supabase and surfaced in the Dashboard, where the chatbot can analyze them directly.

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
- metrics ingested into Supabase
- Dashboard updated with new run data
- chatbot can analyze results via run snapshot

---

# Engineering Design Decisions

- strict context-only generation (prevents hallucination)
- deterministic context assembly
- separation of ingestion vs inference
- streaming responses
- edge execution for performance
- run snapshot injection enables self-referential debugging

---

# Skills Demonstrated

- RAG system design
- AI observability systems
- self-aware AI assistant integration
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
- reasons about historical production metrics
- demonstrates real-world AI system design

---

# Key Insight

This system represents a shift from:

→ static documentation

to:

→ **interactive engineering intelligence with historical data awareness**

It enables users to explore not just:

→ what was built

but:

→ how it works
→ why decisions were made
→ how issues are diagnosed
→ what the system is doing right now
