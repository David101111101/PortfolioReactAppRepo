# Engineering Knowledge Graph — AI Quality Systems & Automation Intelligence

David Abril — QA Automation Engineer / SDET → Quality Systems Engineer

---

# Purpose

This document represents a structured knowledge graph of engineering principles, system design decisions, and problem-solving approaches across this portfolio.

It is designed for:

- AI systems (RAG-based assistants)
- Engineering teams
- Hiring managers

The goal is to explain:

→ how problems are approached  
→ how systems are designed  
→ how decisions are made  

Not just what tools are used.

---

# Engineering Identity

I specialize in designing **Quality Intelligence Systems** for modern applications, particularly AI-driven systems where behavior is:

- probabilistic (not deterministic)
- multi-layered (retrieval, ranking, generation)
- subject to drift over time

---

## Core Objectives

- Increase delivery confidence through system-level validation  
- Reduce operational friction via automation  
- Enable teams to move faster without sacrificing reliability  

---

## Key Shift

Automation is treated as:

→ an engineering system  

NOT:

→ a collection of test cases  

---

# System Design Philosophy

## 1. From Testing → Intelligence

Traditional QA answers:

→ “Did it pass?”

This system answers:

- Why did it change?
- Is it meaningful?
- Who is impacted?
- What should we do next?

---

## 2. Observability-Driven Quality

Modern systems require:

- metrics (latency, confidence, reliability)
- baselines (historical expectations)
- drift detection (trend analysis)

---

## 3. Debugging as a First-Class System

This portfolio introduces a structured debugging layer:

- Metric formulas (how signals are computed)
- Debugging playbooks (how to investigate)
- Correlation rules (how signals interact)

---

## Result

A system that transforms:

→ data → signals → reasoning → action  

---

# AI Observability System (Current State)

## Architecture

CI Tests → Metrics Extraction → Database (Supabase)  
→ SQL Intelligence Layer (views)  
→ Dashboard + RAG Chatbot  
→ Debugging Intelligence Layer  

---

## Signals Collected

- Latency (performance)
- Confidence (retrieval quality)
- Rate limit correctness
- Concurrency degradation
- Flakiness (test reliability)

---

## Derived Signals

### Reliability Score
Composite system health based on normalized signals

### Release Confidence
Decision-oriented signal (go / caution / block)

---

## Key Innovation

All metrics follow:

→ baseline vs actual  
→ deviation  
→ interpretation  

---

# Debugging Intelligence Layer

## Purpose

To enable the system to answer:

- Why did reliability drop?
- Is this latency spike serious?
- Which metric caused the regression?
- What should I check next?

---

## Components

### 1. Metric Formulas

Define how each signal is computed and normalized.

---

### 2. Debugging Playbook

Maps:

→ symptom → cause → investigation steps  

---

### 3. Correlation Rules

Define relationships between signals:

Examples:

- latency ↑ + confidence ↓ → backend affecting retrieval  
- confidence ↓ only → retrieval issue  
- latency ↑ only → performance issue  

---

## Outcome

The system moves from:

→ monitoring  

to:

→ reasoning and decision support  

---

# Career Evolution Model

This portfolio reflects intentional progression:

System Development  
→ Automation Fundamentals  
→ Framework Engineering  
→ Quality Platforms  
→ Production Automation  
→ Quality Intelligence Systems  

---

# Phase Breakdown

## Phase 1 — System Builder Foundation

Focus:
- backend systems
- database design
- authentication
- enterprise workflows

Insight:
Understanding system architecture enables effective automation.

---

## Phase 2 — Automation Fundamentals

Focus:
- browser automation internals
- framework design
- synchronization challenges

Insight:
Tool abstraction requires understanding underlying mechanics.

---

## Phase 3 — Behavior & Collaboration

Focus:
- BDD frameworks
- executable requirements
- cross-team communication

Insight:
Automation can align teams, not just validate systems.

---

## Phase 4 — Full-System Validation

Focus:
- API + DB validation
- security testing
- containerized execution
- flakiness mitigation

Insight:
Reliable systems require validation across multiple layers.

---

## Phase 5 — Observability-Driven Automation

Focus:
- Playwright
- trace-based debugging
- CI/CD integration
- performance awareness

Insight:
Debuggability is as critical as coverage.

---

## Phase 6 — Production Impact

Focus:
- operational automation
- large-scale system configuration
- production-safe execution

Impact:
- reduced manual work
- improved team productivity
- increased delivery speed

Insight:
The highest value automation removes human toil.

---

## Phase 7 — Quality Intelligence Systems (Current)

Focus:
- AI system evaluation
- baseline vs drift detection
- regression intelligence
- debugging automation

Insight:
Modern QA must evolve into system-level intelligence.

---

# Automation Philosophy

## Automation Solves Organizational Problems

Automation should:

- remove repetitive work
- increase release confidence
- provide fast feedback
- reduce cognitive load

---

## Reliability Over Quantity

Priorities:

- stable tests
- clear failures
- fast debugging
- maintainable systems

---

## Observability-First Testing

Tests should produce:

- traces
- logs
- reproducible failures

Tests must explain failures, not just detect them.

---

# Tool Selection Strategy

Tools are selected based on problem characteristics:

- Playwright → reliability + CI + debugging
- Cypress → frontend + rapid feedback
- Puppeteer → low-level control
- BDD → communication clarity

---

## Principle

Tools serve architecture goals, not the opposite.

---

# Quality Engineering Principles

- Shift-left validation  
- Deterministic automation  
- Scalable architecture  
- Developer enablement  
- Continuous verification  

---

# Organizational Impact Model

Automation maturity evolves:

Manual Work  
→ Test Automation  
→ Pipeline Automation  
→ Operational Automation  
→ Engineering Intelligence  

---

# Strength Areas

## Technical

- Playwright, Cypress, Puppeteer  
- CI/CD automation  
- API + DB validation  
- Observability systems  

---

## Engineering

- system design  
- reliability engineering  
- debugging workflows  
- automation strategy  

---

## Organizational

- productivity improvement  
- process automation  
- cross-team enablement  

---

# Summary

This portfolio demonstrates progression from:

Software Developer  
→ Automation Engineer  
→ Quality Systems Engineer  

---

## Central Theme

Engineering systems that:

- improve software quality  
- reduce engineering friction  
- enable faster, safer delivery  

---

## Final Insight

Modern systems cannot be validated with binary testing.

They require:

→ continuous measurement  
→ contextual interpretation  
→ intelligent debugging  

This portfolio reflects that transition.