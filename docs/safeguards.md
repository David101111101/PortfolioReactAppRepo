# RAG Chatbot – Security & Safeguards

## 1. Purpose

This document describes the security controls, abuse mitigations, architectural safeguards, and known limitations of the Portfolio RAG Chatbot system.

The objective is to:
- Prevent prompt injection
- Prevent abuse and spam
- Reduce hallucinations
- Protect system prompts
- Protect backend services
- Ensure safe degradation under failure

## 2. Threat Model

### 2.1 Assets to Protect
- System prompt integrity
- Portfolio document embeddings
- Supabase database
- OpenAI API key
- Worker runtime stability
- Logging integrity

### 2.2 Threat Categories
| Category           | Example                           |
|--------------------|-----------------------------------|
| Prompt Injection   | “Ignore previous instructions…”   |
| Data Exfiltration  | “Reveal your system prompt”       |
| Abuse              | Rapid request flooding            |
| Hallucination      | Fabricated experience             |
| Resource Exhaustion| Long payload attack               |
| Database Abuse     | Direct RPC abuse                  |

## 3. Implemented Safeguards

### 3.1 Network-Level Controls
#### 3.1.1 CORS Allowlist
Only approved origins are allowed:
- Production domain
- Localhost (development)

If origin is not in allowlist:
- `Access-Control-Allow-Origin: null`

This prevents browser-based cross-site exploitation.

#### 3.1.2 POST-Only Enforcement
All non-POST requests return:
- HTTP 405

Reduces attack surface.

### 3.2 Abuse Mitigation
#### 3.2.1 Rate Limiting (Durable Object)
Rate limiting is enforced per IP address using a Cloudflare Durable Object.

Mitigates:
- Flood attacks
- Scripted abuse
- Token exhaustion attempts

When exceeded:
- HTTP 429
- Logged with reason = rate_limited

#### 3.2.2 Input Size Limitation
Maximum question length: **1000 characters**

Prevents:
- Token abuse
- Oversized payload attacks
- Prompt stuffing

### 3.3 Input Validation
Strict JSON parsing:
- Invalid JSON → 400
- Missing question → 400
- Empty question → 400
- Oversized question → 400

This ensures schema-level safety before model interaction.

### 3.4 Prompt Injection Mitigation
The system performs case-insensitive filtering of suspicious patterns including:
- “ignore previous instructions”
- “system prompt”
- “jailbreak”
- “act as”

If detected:
- Request rejected (400)
- No LLM call made

Purpose:
- Prevent system prompt override
- Prevent instruction manipulation
- Prevent jailbreak attempts

### 3.5 Retrieval Safety (RAG Controls)
#### 3.5.1 Similarity Threshold
Minimum similarity threshold: **0.45**

Documents below threshold are discarded.
If no document meets threshold:
- Fallback response is returned
- LLM is NOT called

This reduces hallucination risk.

#### 3.5.2 Context Truncation
Combined document context is truncated to **6000 characters**.

Prevents:
- Context overflow
- Excessive token usage
- Prompt injection via long context

#### 3.5.3 Context-Only System Prompt
The system prompt enforces:
- Use only provided context
- No general knowledge
- No fabrication
- Professional tone

This constrains the LLM behavior.

### 3.6 Output Handling
#### 3.6.1 Controlled Streaming
- LLM responses streamed incrementally
- Streaming errors gracefully handled
- Partial interruption returns safe notice

Prevents:
- Broken response states
- Uncontrolled error leakage

#### 3.6.2 Fallback Responses
When:
- Retrieval fails
- Similarity threshold unmet
- Supabase errors
- OpenAI errors

A deterministic safe message is returned.

This ensures no undefined behavior.

### 3.7 Observability & Logging
All requests are logged asynchronously with:
- IP
- Question
- Answer
- Result reason

Reasons include:
- success
- fallback
- rate_limited
- error

This enables:
- Abuse monitoring
- Model improvement
- Future fine-tuning dataset
- Incident traceability

Logging failures do not block response.

### 3.8 Secret Management
Secrets are injected via environment API keys that are saved once and can't be consulted.
Keys are never exposed to client.

## 4. Database Security

### 4.1 Supabase Access
The worker communicates with Supabase via:
- RPC (`match_documents`)
- Insert into `abuse_logs`

**RLS Requirement:**
Row-Level Security must be enabled to ensure:
- Direct client access is blocked
- RPC is restricted to authorized roles
- Logging table is protected

## 5. Failure Containment
| Failure            | Behavior                        |
|--------------------|---------------------------------|
| OpenAI failure     | 503 response                    |
| Supabase failure   | 500 response                    |
| JSON parse failure | 400                             |
| Streaming failure  | Safe interruption message       |

No internal stack traces are exposed.

## 6. Known Limitations

### 6.1 Injection Detection is String-Based
Current filtering uses pattern matching.

Limitations:
- Can be bypassed with obfuscation
- Does not use semantic classification

Future improvement:
- LLM-based injection classifier
- Heuristic scoring

### 6.2 IP-Based Rate Limiting
Limitations:
- VPN rotation can bypass
- Shared IP users may be throttled

Future improvement:
- CAPTCHA (Cloudflare Turnstile)
- Device fingerprinting
- Token-based rate limiting

### 6.3 No Output Sanitization
Currently:
- Input is filtered
- Output is not post-validated

Future improvement:
- System prompt leakage detection
- Markdown sanitization
- Content moderation filter

### 6.4 No Request Correlation ID
Current limitation:
- No request ID for trace tracing

Future improvement:
- Generate UUID per request
- Include in logs and response headers

## 7. Residual Risk Assessment
| Risk            | Residual Level | Justification                |
|-----------------|---------------|------------------------------|
| Hallucination   | Low           | Similarity + fallback        |
| Prompt injection| Medium        | String-based filtering       |
| Abuse           | Medium        | IP-based rate limiting       |
| Data leakage    | Low           | Context-only enforcement     |
| Service overload| Low           | Graceful degradation         |

## 8. Future Security Roadmap
- Add request correlation IDs
- Add output filtering layer
- Add semantic injection classifier
- Integrate Cloudflare Turnstile
- Add evaluation harness for grounding accuracy
- Implement structured audit logging
- Add timeout with AbortController
