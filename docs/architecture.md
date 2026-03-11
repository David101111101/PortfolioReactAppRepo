# Portfolio RAG Architecture

This document summarizes the major system components and end-to-end data flow for the portfolio site and chatbot.

## High-Level Components

- Frontend: React SPA with chat UI and streaming renderer.
- API layer: Cloudflare Worker orchestrating validation, security, retrieval, and LLM streaming.
- Vector database: Supabase PostgreSQL with pgvector RPC matching.
- Embedding generation: OpenAI embeddings for both offline documents and live queries.
- LLM interaction: OpenAI chat completion streaming grounded by retrieved context.

## Mermaid Diagram

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
