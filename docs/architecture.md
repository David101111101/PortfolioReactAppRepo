# Portfolio R.A.G. Architecture

This document summarizes the major system components and end-to-end data flow for the portfolio site, chatbot, and AI observability dashboard.

## High-Level Components

- Frontend: React SPA with chat UI, streaming renderer, and live AI observability dashboard.
- API layer: Cloudflare Worker orchestrating validation, security, retrieval, and LLM streaming.
- Vector database: Supabase PostgreSQL with pgvector RPC matching and SQL analytics views.
- Embedding generation: OpenAI embeddings for both offline documents and live queries.
- LLM interaction: OpenAI chat completion streaming grounded by retrieved context.
- Observability: Weekly CI metrics ingested into Supabase, surfaced in a live React dashboard.

## Architecture Diagram

```mermaid
flowchart LR
  subgraph Client[Client Layer]
    U[User]
    CW[ChatWidget]
    APIClient[chatApi]
    StreamClient[streamAssistant]
  end

  subgraph Security[Security Layer]
    Handler[index.ts handler]
    Validate[Request validation and CORS]
    RL[Rate limit check]
    PG[Prompt guard]
    DO[Durable Object RateLimiter]
    Log[Conversation logging]
    Logs[(Supabase abuse_logs)]
  end

  subgraph Retrieval[Retrieval Layer]
    QEmb[Generate query embedding]
    EMB[OpenAI embeddings text-embedding-3-small]
    VS[Vector search]
    VDB[(Supabase pgvector documents and match_documents RPC)]
    RG[Retrieval guard]
    CB[Context builder]
    Fallback[Fallback response]
  end

  subgraph Generation[Generation Layer]
    LLMCall[LLM streaming call]
    LLM[OpenAI chat model gpt-4o-mini]
  end

  subgraph Ingestion[Offline Document Ingestion]
    SRC[Markdown and PDF sources]
    Ingest[scripts/ingest.ts]
    Chunk[Chunking and metadata priority]
    DEmb[Generate document embeddings]
    Upsert[Upsert chunks and vectors]
  end

  U -->|Ask question| CW
  CW --> APIClient
  APIClient -->|POST chat| Handler
  Handler --> Validate --> RL --> PG --> QEmb --> VS --> RG --> CB --> LLMCall
  LLMCall -->|Stream tokens| StreamClient
  StreamClient -->|Progressive render| CW

  RL -->|Per IP window check| DO
  RG -->|Low confidence| Fallback
  Fallback -->|Suggested prompts| StreamClient

  QEmb -->|Embed query| EMB
  VS -->|Similarity match RPC| VDB
  LLMCall -->|Context grounded completion| LLM
  Handler --> Log --> Logs

  SRC --> Ingest --> Chunk --> DEmb --> Upsert --> VDB
  DEmb -->|Embed document chunks| EMB
```

## Data Flow Summary

1. Ingestion reads markdown/PDF files, chunks content, generates embeddings, and upserts vectors into Supabase.
2. Frontend sends user questions to the Worker API.
3. API validates input, enforces rate limits, and blocks suspicious prompts.
4. API generates query embeddings and retrieves semantically similar chunks from pgvector.
5. Retrieved chunks are filtered and assembled into context.
6. API calls the LLM with grounded context and streams output back to the frontend.
7. Frontend renders streamed tokens in real time.
8. Weekly CI regression results are ingested into Supabase and surfaced in the live AI Observability Dashboard.

## Sequence Diagram: Chatbot Query Flow

```mermaid
sequenceDiagram
  autonumber
  box Client Layer
    actor User
    participant ChatWidget as Frontend ChatWidget
    participant ChatApi as Frontend chatApi
    participant StreamClient as Frontend streamAssistant
  end

  box Security Layer
    participant Worker as Cloudflare Worker API
    participant RateLimiter as Durable Object RateLimiter
    participant PromptGuard as Prompt Guard
    participant Logs as Supabase abuse_logs
  end

  box Retrieval Layer
    participant OpenAIEmb as OpenAI Embeddings API
    participant Supabase as Supabase pgvector RPC
    participant RetrievalGuard as Retrieval Guard
    participant ContextBuilder as Context Builder
  end

  box Generation Layer
    participant OpenAILLM as OpenAI Chat API
  end

  User->>ChatWidget: Enter question and send
  ChatWidget->>ChatApi: Build request payload
  ChatApi->>Worker: POST /chat with question

  Worker->>Worker: Validate JSON, CORS, and input format
  Worker->>RateLimiter: Check per-IP sliding window

  alt Rate limit exceeded
    RateLimiter-->>Worker: Block request
    Worker-->>ChatApi: 429 rate limited response
    Worker->>Logs: Write reason=rate_limited
    ChatApi-->>ChatWidget: Show rate limit message
  else Rate limit allowed
    RateLimiter-->>Worker: Allow request
    Worker->>PromptGuard: Inspect prompt for risky patterns

    alt Prompt blocked
      PromptGuard-->>Worker: Block with category
      Worker-->>ChatApi: 400 blocked request
      Worker->>Logs: Write blocked reason
      ChatApi-->>ChatWidget: Show safe rejection message
    else Prompt allowed
      PromptGuard-->>Worker: Pass
      Worker->>OpenAIEmb: Generate query embedding
      OpenAIEmb-->>Worker: Query vector
      Worker->>Supabase: match_documents RPC with embedding
      Supabase-->>Worker: Candidate chunks with similarity
      Worker->>RetrievalGuard: Filter low-confidence results

      alt No relevant chunks
        RetrievalGuard-->>Worker: Reject low similarity set
        Worker-->>ChatApi: Fallback response
        Worker->>Logs: Write reason=fallback_low_similarity
        ChatApi-->>ChatWidget: Render fallback suggestions
      else Relevant chunks found
        RetrievalGuard-->>Worker: Keep relevant chunks
        Worker->>ContextBuilder: Build bounded context
        ContextBuilder-->>Worker: Grounded context text
        Worker->>OpenAILLM: Stream completion with context

        loop For each streamed token chunk
          OpenAILLM-->>Worker: Delta token chunk
          Worker-->>ChatApi: Stream chunk to client
          ChatApi-->>StreamClient: Forward bytes/text
          StreamClient-->>ChatWidget: Progressive UI update
        end

        Worker->>Logs: Write reason=success with metadata
        ChatApi-->>ChatWidget: Complete final assistant message
      end
    end
  end
```

## AI Observability Dashboard

`src/pages/Dashboard.tsx` is a live React page accessible at `/#/dashboard`. It queries Supabase directly via the REST API and renders real production metrics derived from the weekly regression suite. The dashboard closes the observability loop: CI tests generate data, Supabase stores and analyses it, and the Dashboard surfaces it.

### Dashboard Panels

| Panel | Source View | What It Shows |
|-------|-------------|---------------|
| P95 Latency | `regression_run_comparison` | Current latency vs historical baseline (5 400 ms); deviation classified as Healthy / Degraded / Severe |
| Retrieval Confidence | `retrieval_language_summary` | avg and min confidence per language (EN, ES, FR, DE, PT, ZH, JA); risk bands: Critical <60, Risk 60–75, Healthy ≥75 |
| Reliability Score | `regression_run_comparison` | Pass-rate × 0.7 + flakiness-factor × 0.2 + all-passed bonus × 0.1; baseline 91 |
| Rate-Limit Enforcement | `regression_run_comparison` | Measured block rate vs expected 30.8% (10 req/IP, 13-request probe); drift bands: Healthy / Slight / Degraded / Severe |
| Flakiness Trend | `flakiness_run_summary`, `flakiness_trend` | Current flakiness % + sparkline over last 5 runs; SLA: green <1%, yellow <3%, red ≥3% |
| Regression Story | `regression_story` | Human-readable narrative: trend direction, severity, primary signal, user impact, analysis confidence |
| Test Runs | `e2e_workflow_stability` | Per-workflow pass/fail table with commit SHA and timestamp |
| Flaky Test Detail | `test_flakiness_enriched` | Per-test flakiness %, severity, recency, last seen timestamp |

### Observability Data Pipeline

```mermaid
flowchart TD
  subgraph CI["Weekly Scheduled Regression"]
    BackendTests["Production API Regression Suite\nLatency · Confidence · Rate Limit"]
    E2ETests["E2E Test Suite\nPer-test Metric Collection"]
  end

  subgraph Ingestion["Metrics Ingestion"]
    UploadMetrics["Regression Metric Upload\nto Supabase"]
    IngestE2E["E2E Metric Ingestion\nReliability Score Computation"]
  end

  subgraph SupabaseTables["Supabase Tables"]
    TestRuns[("Test Run Records\n& Per-test Results")]
    RegressionMetrics[("Regression Metrics\n& Latency Signals")]
  end

  subgraph SupabaseViews["SQL Intelligence Layer"]
    RegComparison["Run-over-Run Comparison\nLatency · Confidence · Reliability"]
    RegStory["Regression Story\nTrend · Severity · User Impact"]
    FlakinessViews["Flakiness Intelligence\nPer-run · Trend · Per-test"]
    LangSummary["Language Confidence\n7-language Breakdown & Trend"]
    E2EStability["Workflow Stability\nPer-browser Pass & Fail"]
  end

  subgraph Dashboard["AI Observability Dashboard"]
    LatencyPanel["Latency Health\nDeviation vs Historical Baseline"]
    ConfidencePanel["Retrieval Confidence\nPer-language Risk Bands"]
    ReliabilityPanel["Reliability Score Trend\nWeighted · Visualised over Time"]
    RatePanel["Rate-Limit Enforcement\nCorrectness & Drift Bands"]
    FlakinessPanel["Flakiness Tracker\nSparkline & Per-test Detail"]
    StoryPanel["Regression Story\nNarrative · Severity · Who Is Affected"]
  end

  BackendTests --> UploadMetrics --> RegressionMetrics
  E2ETests --> IngestE2E --> TestRuns

  TestRuns --> FlakinessViews
  TestRuns --> E2EStability
  RegressionMetrics --> RegComparison
  RegressionMetrics --> RegStory
  RegressionMetrics --> LangSummary

  RegComparison --> LatencyPanel
  RegComparison --> ReliabilityPanel
  RegComparison --> RatePanel
  RegStory --> StoryPanel
  LangSummary --> ConfidencePanel
  FlakinessViews --> FlakinessPanel
  E2EStability --> StoryPanel
```

### SLA Status System

All panels use a four-band status system driven by deviation from historical baselines:

| Status | Color | Meaning |
|--------|-------|---------|
| Healthy | Green | Within expected range or improved |
| Slight degradation | Yellow | Early warning — monitor |
| Degraded | Orange | Meaningful regression — investigate |
| Severe | Red | SLA breach — block release |

Baselines are derived from historical production data and stored as constants in `Dashboard.tsx`:
- P95 latency expected: `5 400 ms`, degraded threshold: `5 800 ms`
- Retrieval confidence expected: `81%`, warn threshold: `75%`
- Reliability score expected: `91`, warn threshold: `88`
- Rate-limit enforcement expected: `30.8%` (±2% green, ±5% yellow, ±10% orange)
