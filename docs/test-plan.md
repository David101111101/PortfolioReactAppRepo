# Portfolio RAG Chatbot — QA Automation Test Plan

## 1. Objective

This document defines the Quality Assurance strategy for the RAG Chatbot.

The goal is to ensure:

- Stable API behavior
- Secure request handling
- Reliable retrieval-augmented responses
- Functional multilingual support
- Acceptable performance and usability
- Repeatable automated validation through CI pipelines

This plan reflects a pragmatic automation approach aligned with QA Automation Engineer responsibilities.

---

## 2. System Overview

### Architecture

- Edge Runtime: Cloudflare Worker
- State Coordination: Durable Object (rate limiting)
- Retrieval Layer: Supabase RPC + pgvector similarity search
- AI Provider: OpenAI embeddings and chat completion
- Frontend: Static SPA (GitHub Pages deployment)

### Runtime Flow

1. Client sends POST request to Worker endpoint
2. Worker validates protocol and payload
3. Rate limiter enforces per-IP throttling
4. Prompt guard validates input safety
5. Embedding + retrieval executed
6. Context constructed and sent to LLM
7. Response returned or safe fallback triggered

---

## 3. Test Scope

### In Scope

- HTTP protocol validation
- Prompt guard and input validation
- Rate limiting behavior
- Retrieval grounding behavior
- Multilingual query handling
- Response schema stability
- Performance baseline validation
- Critical frontend flows
- Accessibility baseline
- CI automation gates

### Out of Scope

- LLM model training or internal weights
- Supabase infrastructure internals
- Global CDN network reliability
- Third-party provider uptime guarantees

---

## 4. Test Strategy

### 4.1 Deterministic Validation

Focus on verifiable system behaviors:

- HTTP status codes
- response schema validation
- guard rule outcomes
- context truncation logic
- rate-limit enforcement

### 4.2 Semantic / AI Validation

Focus on expected system behavior rather than exact text:

- grounded answer contains expected concepts
- fallback response triggered when retrieval confidence is low
- multilingual queries still retrieve relevant context
- no unsafe or hallucinated claims in known weak-retrieval scenarios

---

## 5. Test Levels

### Unit Tests

Objective: validate isolated logic components.

Coverage targets:

- prompt guard classification
- context builder truncation
- fallback decision conditions
- helper utilities

### API Contract Tests

Objective: ensure client integration stability.

Coverage targets:

- valid request returns 200
- invalid method returns 405
- invalid content-type returns 415
- malformed payload returns 400
- rate-limit exceeded returns 429
- dependency failure returns safe 5xx response

### Integration Tests

Objective: validate interaction with retrieval and AI flow.

Coverage targets:

- embedding generation success path
- retrieval returns relevant chunks
- retrieval returns empty results → fallback path
- similarity threshold filtering applied correctly

### End-to-End Tests

Objective: validate user-visible behavior.

Coverage targets:

- chat flow works from UI input to response rendering
- navigation between sections functions correctly
- each external link opens the expected target domain and slug
- light and dark mode correctly changes the theme color
- UI handles loading and error states
- accessibility violations baseline check using axe

---

## 6. Multilingual Testing Strategy

The chatbot supports multilingual user queries.  
Automation must verify behavior consistency across languages.

### Test Coverage

- Spanish factual queries retrieve correct context
- Mixed English–Spanish queries still produce grounded responses
- Poor grammar / informal phrasing still yields relevant retrieval
- Fallback behavior identical regardless of query language


### Example Test Data

- Spanish question about portfolio content
- Long Spanish question with multiple clauses
- Irrelevant multilingual question to trigger fallback

---

## 7. Performance Validation

Automation checks baseline responsiveness.

Current thresholds:

- Median response latency < 8 seconds
- Maximum latency < 10 seconds
- System handles at least 3 concurrent requests without failure

Performance tests run in scheduled CI regression to detect drift.

---

## 8. Accessibility and UX Validation

Automated checks include:

- axe accessibility scan on main chat page
- keyboard navigation baseline
- error state rendering verification

---

## 9. Test Environments

| Environment | Purpose |
|--------|--------|
| Local | fast unit and integration validation |
| PR CI | merge protection gate |
| Production Endpoint | scheduled regression validation |

Environment variables:

- API_BASE_URL used for regression runs
- test mode headers used for deterministic scenarios where required

---

## 10. Automation Tooling

- Test Runner: Vitest
- E2E Framework: Playwright
- Accessibility: axe-core
- Performance Budget: Lighthouse CI
- CI Platform: GitHub Actions

---

## 11. CI Quality Gates

### Pull Request Gate

Must pass:

- backend automated tests
- Chromium E2E tests
- Lighthouse minimum thresholds

### Deployment Gate

Must pass:

- backend test suite
- multi-browser E2E matrix
- accessibility checks

### Scheduled Regression

Weekly automated validation:

- production health check
- retrieval grounding regression tests
- latency monitoring tests
- rate-limit behavior verification

---

## 12. Defect Severity Guidelines

**Severity 1**

- security bypass
- API unavailable
- critical contract regression

**Severity 2**

- retrieval produces unsafe or clearly incorrect answer
- rate-limit not enforced
- repeated latency threshold breach

**Severity 3**

- minor UX or accessibility issue
- non-blocking performance degradation

---

## 13. Future Improvements Roadmap

- Expand multilingual dataset coverage
- Add observability validation tests once telemetry expands
- Add higher concurrency performance testing
- Introduce structured test data management strategy