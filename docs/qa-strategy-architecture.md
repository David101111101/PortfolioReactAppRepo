# QA Automation Strategy – Multi-Layer Quality Gates

## Overview
This document outlines a comprehensive quality gates strategy that evolves QA automation from traditional testing (unit, contract, E2E, accessibility) into AI-era assurance. By layering deterministic assertions, semantic validations, security evaluations, and performance monitoring across PR, deployment, and production stages, we ensure that AI-driven chatbot responses are trustworthy, secure, and performant.

The strategy demonstrates how QA automation engineers can shift left on AI assurance: embedding security checks at the edge, validating retrieval confidence before LLM calls, monitoring latency regressions, and catching prompt injection attempts before they reach the model.

## Quality Gates Strategy

```mermaid
flowchart TD
  DevCommit["Developer Commit
(Feature/Fix Branch)"]

  DevCommit --> PRGate

  subgraph PRGate["1. PR Quality Gate"]
    PRBackend["Backend Unit & API Contract Tests"]
    PRSecurity["Security & PII Tests"]
    PRE2E["E2E Chromium Smoke tests"]
    PRLighthouse["Lighthouse SEO, Accessibility & Performance Thresholds"]
  end

  PRGate -->|Pass| BuildArtifacts["Build Artifacts
Generated"]
  PRGate -->|Fail| BlockMerge["🚫 Block Merge"]

  BuildArtifacts --> DeployGate

  subgraph DeployGate["2. Deploy Quality Gate"]
    DepBackend["Backend Unit & Contract Tests"]
    DepMultiBrowser["Multi-Browser E2E
Chromium, Firefox, WebKit"]
    DepJUnit["JUnit Results to
GitHub Checks"]
    DepLighthouse["Lighthouse SEO, Accessibility & Performance Thresholds"]
  end

  DeployGate -->|Pass| ProductionDeploy["Deploy to
GitHub Pages"]
  DeployGate -->|Fail| BlockRelease["🚫 Block Release"]

  ProductionDeploy --> RegressionMonitor

  subgraph RegressionMonitor["3. Weekly Regression Suite"]
    ProdHealth["Health Check:
Deployed API Endpoint"]
    ProdBackend["Regression Tests vs
Production Endpoint"]
    ProdRAG["RAG Retrieval
  Regression Checks"]
    ProdRateLimit["Rate Limiting
  Regression Checks"]
    ProdLatency["LLM Latency
  Monitoring and Drift"]
  end

  RegressionMonitor --> Observability

  subgraph Observability["QA Observability & Insights"]
    Metrics["Test Metrics Dashboard"]
    Traces["Test Artifact Traces"]
    Dashboards["Failure Trend Analysis"]
    LoggingAI["AI Model Response Logging"]
  end

  Observability -.->|Continuous Feedback| DevCommit
```


## Test Type Mapping: Deterministic → Semantic → Safety → Performance

```mermaid
flowchart LR
  subgraph Deterministic["Deterministic Tests (PR)"]
    UnitTests["api.contract.test.ts
contextBuilder.test.ts
promptGuard.test.ts
prompt.test.ts"]
  end

  subgraph Semantic["Semantic & Integration (Deployment)"]
  ContractTests["api.contract.test.ts
contextBuilder.test.ts
promptGuard.test.ts"]
    E2E["a11y.spec.ts
navigation.spec.ts
smoke.spec.ts"]
    Lighthouse["Lighthouse: FCP, LCP,
CLS, Accessibility Score"]
  end

  subgraph Safety["Safety & Stability (Weekly Scheduled)"]
    RAGTests["retrieval.regression.test.ts
Retrieval threshold gate"]
  RateLimitTests["rateLimit.test.ts
Per-IP throttle regression"]
  PerfTests["performance.test.ts
Median/max latency stability checks"]
  end

  subgraph Performance["Performance Monitoring (Continuous)"]
  LatencyBudget["Rate limiter: 10 req/min
LLM warning threshold: 3.5s
Weekly latency gate: median and max"]
    StressTests["Concurrent request
burden tests"]
    LLMBehavior["Model response assertion
Fallback accuracy"]
  end

  Deterministic -->|Shift-left gate| PRStage["Pull Request Gate
(Fast, Parallel)"]
  Semantic -->|Pre-release gate| DeployStage["Deployment Gate
(Comprehensive)"]
  Safety -->|Production health| ProdStage["Production Monitoring
(Weekly schedule and On-demand)"]
  Performance -->|Continuous SLO track| Observability["QA Dashboard
& Alerting"]

  style Deterministic fill:#e1f5e1
  style Semantic fill:#e3f2fd
  style Safety fill:#fff3e0
  style Performance fill:#fce4ec
```

## Test Artifact Inventory

| Category | Test Files | Purpose | Frequency |
|----------|-----------|---------|----------|
| **Backend PR/Deploy Core** | `api.contract.test.ts`, `contextBuilder.test.ts`, `promptGuard.test.ts`, `prompt.test.ts` | API contract validation, prompt safety checks, context builder behavior | PR + Deploy |
| **Backend Weekly Regression** | `retrieval.regression.test.ts`, `performance.test.ts`, `rateLimit.test.ts` | Retrieval grounding drift, latency stability, rate-limit enforcement on deployed API | Weekly (production endpoint) |
| **Frontend E2E** | `a11y.spec.ts`, `navigation.spec.ts`, `smoke.spec.ts` | Accessibility, navigation, critical UX + chatbot mocked interaction | PR (chromium) + Deploy (chromium/firefox/webkit) |
| **Security Scenarios** | Prompt injection, PII detection, SQL/XSS/encoded payload patterns | Input validation and guard effectiveness at request layer | PR + Deploy |
| **Performance Gates** | Lighthouse assertions, weekly scheduled latency checks, rate limit regression | Web vitals/accessibility budgets + backend latency guardrails | Deploy + Weekly |

## Why This Approach Matters For AI Assurance

1. **Shift-Left Security**: Prompt guards run in CI/CD *before* deployment, catching injection attempts in PR reviews.
2. **Semantic Validation**: Rather than just API status codes, we assert *meaningful* retrieval hits and context relevance.
3. **Observable Regressions**: Failure logs are tied to abuse_logs and conversation traces, enabling post-incident analysis.
4. **AI-Specific Metrics**: We track LLM latency, fallback rates, and retrieval confidence—traditional QA metrics don't apply.
5. **Production Health First**: Weekly regression tests hit the deployed endpoint, not mocks, catching real-world degradation.