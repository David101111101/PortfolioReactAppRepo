# RAG Chatbot – Test Plan

## 1. Document Information

| Field         | Value                                                      |
|--------------|------------------------------------------------------------|
| Project      | Portfolio RAG Chatbot                                      |
| Architecture | Cloudflare Worker + Durable Objects + Supabase + OpenAI    |
| Author       | David                                                      |
| Version      | 1.0                                                        |
| Last Updated | YYYY-MM-DD                                                 |

## 2. Purpose

This document defines the testing strategy, scope, coverage criteria, and validation mechanisms for the Portfolio RAG Chatbot system.

The objective is to:
- Ensure functional correctness
- Prevent prompt injection & abuse
- Validate RAG grounding behavior
- Verify system resilience under load
- Demonstrate CI-integrated automated validation

## 3. System Overview

### 3.1 Architecture Components
- Cloudflare Worker (Edge runtime)
- Durable Object (Rate Limiter)
- OpenAI Embeddings + LLM API
- Supabase (Vector search via RPC)
- Logging Table (abuse_logs)

### 3.2 High-Level Flow
1. Validate request
2. Rate limit by IP
3. Generate embedding
4. Perform vector search
5. Filter by similarity threshold
6. Build context
7. Call LLM (streaming)
8. Log result

## 4. Test Strategy

### 4.1 Testing Levels
| Level         | Purpose                    | Tools                        |
|--------------|----------------------------|------------------------------|
| Unit         | Validate pure logic        | Vitest                       |
| Integration  | Validate worker behavior   | Miniflare                    |
| Security     | Validate abuse mitigation  | Custom tests                 |
| RAG Validation | Validate retrieval & fallback | Mocked embedding + RPC   |
| CI/CD        | Automated validation pipeline | GitHub Actions           |

## 5. Test Scope

### 5.1 In Scope
- Request validation
- Rate limiting
- Prompt injection filtering
- Similarity threshold behavior
- Context truncation
- Streaming error handling
- Logging behavior
- Fallback logic
- Error responses
- RAG grounding enforcement

### 5.2 Out of Scope
- OpenAI model internal behavior
- Supabase internal vector indexing
- Internet-level DDoS mitigation

## 6. Functional Test Cases

### 6.1 Request Validation
| ID      | Scenario                | Expected Result |
|---------|-------------------------|-----------------|
| FUNC-01 | Valid POST request      | 200             |
| FUNC-02 | GET request             | 405             |
| FUNC-03 | Invalid JSON            | 400             |
| FUNC-04 | Missing question field  | 400             |
| FUNC-05 | Empty question          | 400             |
| FUNC-06 | Question > 1000 chars   | 400             |

### 6.2 Rate Limiting
| ID    | Scenario                  | Expected        |
|-------|---------------------------|-----------------|
| RL-01 | First request             | Allowed         |
| RL-02 | Within allowed threshold  | Allowed         |
| RL-03 | Exceeds threshold         | 429             |
| RL-04 | Rate-limited request logged | reason = rate_limited |

### 6.3 Prompt Injection Protection
| ID     | Scenario                        | Expected |
|--------|---------------------------------|----------|
| SEC-01 | “ignore previous instructions”  | 400      |
| SEC-02 | “system prompt”                 | 400      |
| SEC-03 | Case-variant injection          | Blocked  |
| SEC-04 | Jailbreak attempt               | Blocked  |

## 7. RAG-Specific Test Cases

This section demonstrates ML system awareness.

### 7.1 Similarity Threshold Behavior
| ID     | Scenario                | Expected         |
|--------|-------------------------|------------------|
| RAG-01 | similarity < 0.30       | fallback         |
| RAG-02 | similarity >= 0.30      | LLM called       |
| RAG-03 | Empty retrieval array   | fallback         |
| RAG-04 | Invalid retrieval format| 500              |

### 7.2 Hallucination Prevention
| ID     | Scenario                  | Expected             |
|--------|---------------------------|----------------------|
| RAG-05 | Question not in dataset   | fallback message     |
| RAG-06 | Question in dataset       | grounded answer      |
| RAG-07 | LLM attempts fabrication  | constrained by context |

### 7.3 Context Truncation
| ID     | Scenario                | Expected                   |
|--------|-------------------------|----------------------------|
| RAG-08 | Large combined docs     | Context sliced to 6000 chars|
| RAG-09 | Small docs              | No truncation              |

## 8. Security Testing

### 8.1 Injection Testing
- Prompt injection attempts
- SQL injection strings
- XSS payloads
- Unicode bypass attempts

### 8.2 Abuse Testing
- Rapid request flood
- Rotating IP simulation
- Long payload attack
- Malformed RPC responses

## 9. Observability & Logging Validation
| ID     | Scenario            | Expected                  |
|--------|---------------------|---------------------------|
| LOG-01 | Successful request  | Logged with reason=success|
| LOG-02 | Fallback            | reason=fallback           |
| LOG-03 | Error               | reason=error              |
| LOG-04 | Rate limited        | reason=rate_limited       |

Validate:
- IP stored
- Question stored
- Answer stored
- No sensitive system prompt logged

## 10. Performance Testing

### 10.1 Latency Targets
| Operation      | Target     |
|---------------|------------|
| Validation     | < 10ms     |
| Embedding      | < 800ms    |
| Vector search  | < 300ms    |
| Full response  | < 2.5s     |

### 10.2 Streaming Validation
- First token < 1.5s
- No abrupt termination
- Graceful interruption handling

## 11. Resilience Testing
| Scenario              | Expected                      |
|-----------------------|-------------------------------|
| OpenAI timeout        | 503                           |
| Supabase unavailable  | 500                           |
| JSON parse failure    | 500                           |
| Streaming interruption| Partial message + safe close  |

## 12. CI/CD Validation

### 12.1 Automated Steps
- Lint
- Type check
- Unit tests
- Coverage enforcement
- Dependency audit

### 12.2 Coverage Threshold
- Minimum 80% branch coverage
- 90% for validation logic

## 13. Known Limitations
- Basic string-based injection detection
- No semantic classifier for prompt injection
- IP-based rate limiting vulnerable to VPN rotation
- No CAPTCHA layer
- Output not post-filtered

## 14. Risk Assessment
| Risk            | Mitigation           |
|-----------------|---------------------|
| Hallucination   | Similarity threshold |
| Prompt injection| Input filtering      |
| Abuse           | Rate limiting        |
| Data leakage    | Context-only prompt  |
| Overload        | Graceful fallback    |

## 15. Future Improvements
- Add semantic injection detection
- Add CAPTCHA/Turnstile
- Add output filtering
- Add structured request ID
- Add evaluation harness
- Add automated RAG evaluation scoring

## 16. Traceability Matrix
| Safeguard         | Test Case   |
|-------------------|------------|
| Rate limiting     | RL-*       |
| Injection filter  | SEC-*      |
| Similarity threshold | RAG-01  |
| Context truncation| RAG-08     |
| Logging           | LOG-*      |
