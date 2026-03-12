# RAG Chatbot – Security & Safeguards (Current Implementation)

## 1) Purpose

This document describes the security controls currently implemented in the portfolio chatbot backend (`portfolio-chatbot/src/index.ts`) and related modules.

Goals of the current design:
- Block abusive or suspicious input early
- Reduce low-confidence retrieval before generation
- Protect backend services from request flooding
- Keep degraded behavior deterministic and user-safe
- Preserve observability for incident review

## 2) System Threat Surface

### 2.1 Protected Assets
- Worker runtime availability
- OpenAI API key (server-side only)
- Supabase service-role access path
- Retrieval quality and grounded responses
- Audit trail in `abuse_logs`

### 2.2 Main Threat Categories
| Category | Current Mitigation |
|---|---|
| Prompt injection / jailbreak | `inspectPrompt()` pattern + normalization checks |
| PII submission | PII pattern detection in prompt guard |
| Abuse / spam | Per-IP Durable Object rate limiter |
| Low-confidence retrieval | Similarity-based retrieval guard + fallback |
| Resource abuse | Input-size limits + strict content-type |
| Backend dependency failure | Controlled fallback and error responses |

## 3) Implemented Safeguards

### 3.1 Network and Request Entry Controls

#### 3.1.1 CORS Allowlist + Origin Enforcement
Allowed origins are explicitly listed in code:
- `https://www.daveautomation.dev`
- `https://daveautomation.dev`
- `http://localhost:5173`
- `https://portfolio-chatbot.davidstevenabril.workers.dev`

Behavior:
- If `Origin` header is present and not allowlisted, request is rejected with `403 Forbidden`.
- CORS headers are returned for allowed origins.

#### 3.1.2 Method Handling
- `OPTIONS` → preflight response
- `HEAD` → `200`
- `POST` → main chat handler
- Any other method → `405`

#### 3.1.3 Content-Type Enforcement
- Requests not including `application/json` are rejected with `415 Unsupported Content-Type`.

### 3.2 Abuse Mitigation

#### 3.2.1 Rate Limiting (Durable Object)
Implemented in `portfolio-chatbot/src/rateLimiter.ts`:
- Sliding window: `60s`
- Max requests: `10` per IP per window
- Exceeded limit response: `429`

### 3.3 Input Validation and Prompt Safety

#### 3.3.1 JSON / Schema Validation
- Invalid JSON → `400 Invalid JSON`
- Missing or invalid `question` field → `400 Invalid request format`
- Empty question after trim → `400`

#### 3.3.2 Prompt Guard (`inspectPrompt`)
Guard behavior in `portfolio-chatbot/src/security/promptGuard/promptGuard.ts`:
- Input normalization before matching
- Length check (`> 1000`) blocks request
- High symbol-density pattern blocks request
- PII patterns block request
- Category-based pattern matching blocks request:
  - `PROMPT_INJECTION`
  - `DATA_EXFILTRATION`
  - `SQL_INJECTION`
  - `XSS`
  - `COMMAND_INJECTION`
  - `SSRF`
  - `ENCODED_PAYLOAD`

Blocked prompt behavior:
- `400` with safe text response
- RAG pipeline is not executed
- Event is logged asynchronously

### 3.4 Retrieval Safety Controls

#### 3.4.1 Embedding + Search Path
- Query embedding model: `text-embedding-3-small`
- Vector lookup via Supabase RPC: `match_documents`

#### 3.4.2 Similarity Guard
Implemented in `inspectRetrieval(documents, minSimilarity)`:
- Default minimum similarity used by handler: `0.35`
- For short questions (`<= 4` words), threshold is reduced to `0.23`
- Match count defaults to `7`, increased to `9` for short questions

#### 3.4.3 Context Construction
`buildContext()` safeguards:
- Priority order: `high -> medium -> normal`
- Deterministic truncation up to `6000` characters

### 3.5 Generation and Output Handling

#### 3.5.1 Constrained Generation Configuration
- Model: `gpt-4o-mini`
- `temperature: 0`
- `max_tokens: 300`
- Streaming enabled

System prompt constraints include:
- first-person persona
- context-only answering
- no fabrication
- no prompt rule disclosure

#### 3.5.2 Safe Degradation and Fallbacks
Current fallback/error behavior:
- Supabase retrieval error/parsing issue → `500` with safe message
- OpenAI stream initialization failure → `503` with safe message
- Streaming interruption → safe interruption message in stream
- Global unexpected error → `500` with safe generic message

### 3.6 Observability and Logging

Asynchronous logging to Supabase `abuse_logs` includes:
- `question`
- `reason`
- `answer`

Operational signals also include:
- retrieval latency
- LLM latency
- total RAG latency
- warning when LLM latency exceeds `3500ms`

Note: current application-level logging payload does not explicitly store IP.

### 3.7 Secret Handling
- OpenAI and Supabase credentials are read from Worker environment bindings.
- Secrets are not returned to the client.

## 4) Known Limitations (Current State)

1. Prompt guard is primarily pattern-based and can be bypassed by novel obfuscation.
2. No dedicated post-generation output moderation/sanitization layer.
3. Rate limiting is IP-based and can be imperfect with VPN/shared IP scenarios.
4. No request correlation ID in response headers/log events.
5. Logging schema in DB is minimal for now.

## 5) Residual Risk Snapshot

| Risk | Current Residual Level | Why |
|---|---|---|
| Prompt injection bypass | Medium | Pattern-based guard without semantic classifier |
| Hallucination | Low-Medium | Retrieval guard + context constraints, but no output verifier |
| Abuse/flooding | Medium | Strong basic IP throttling, no CAPTCHA/device layer |
| Data leakage | Low | Context-constrained prompt and server-side secrets |
| Service degradation | Low-Medium | Graceful fallbacks implemented; third-party dependency risk remains |

## 6) Security Roadmap (Not Yet Implemented)

- Semantic prompt-injection classifier
- Output safety moderation layer
- Request correlation IDs
- Structured audit logging schema
- CAPTCHA / Turnstile for abuse-resistant public traffic
- Stronger policy checks around retrieval-to-answer grounding