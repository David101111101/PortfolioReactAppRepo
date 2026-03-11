# Interactive RAG AI Chat Assistant Architecture

[![Weekly Regression Suite](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/weekly-regression-gates.yml/badge.svg)](https://github.com/David101111101/PortfolioReactAppRepo/actions/workflows/weekly-regression-gates.yml)

## Overview
This portfolio includes a custom AI assistant designed and implemented by Dave to allow recruiters and engineers to interactively explore his projects, technical experience, and engineering decisions.


The assistant is not a generic chatbot. It is a Retrieval-Augmented Generation (RAG) system that answers questions strictly using verified portfolio documents.


## Technologies Used

This project leverages a modern stack of technologies to deliver a secure, performant, and production-style AI assistant:

- **Cloudflare Workers**: Serverless edge execution for low-latency API and inference
- **Supabase**: Managed backend platform for authentication and vector database
- **PostgreSQL**: Underlying programming language database engine for Supabase, used for storing document metadata and vector embeddings
- **OpenAI API (GPT-4o-mini)**: Language model for grounded, context-aware responses
- **OpenAI Embeddings**: For semantic document chunk vectorization
- **Wrangler**: programming language CLI tool for developing, deploying, and managing Cloudflare Workers
- **TypeScript**: programming language for backend and ingestion pipeline
- **Node.js**: Runtime for ingestion scripts and local development
- **SHA-256**: Cryptographic hashing for document integrity and idempotency
- **Playwright**: End-to-end testing for frontend and API reliability
- **Vite**: Frontend tooling for fast development and builds

These technologies were selected to ensure scalability, security, and maintainability across the ingestion, retrieval, and serving layers of the portfolio assistant.

## Security & Guardrails

The assistant implements multiple layers of protection:

- **Prompt Injection Guard:** Blocks suspicious input patterns (e.g., "ignore previous", "jailbreak", SQL keywords, exfiltration attempts, high symbol density, or excessive length).
- **Retrieval Guard:** Only includes context chunks with similarity ≥ 0.40, blocks low-confidence retrievals.
- **Strict Context-Only Answering:** LLM is instructed to answer strictly from retrieved portfolio data, never from general knowledge.
- **Sensitive Data Protection:** Never reveals secrets or environment details.
- **Rate Limiting:** Per-IP sliding window (10 requests/minute) using Durable Objects.
- **Abuse Logging:** All blocked or suspicious requests are logged to Supabase for analysis.

---

## Testing & Ingestion

- **Run tests:**
  ```bash
  npm test
  ```
- **Ingest new/updated documents:**
  ```bash
  npm run ingest
  ```
  (See `scripts/ingest.ts` for details)

---

## Configuration

Set the following environment variables in your `.env` file:

- `OPENAI_API_KEY`         # OpenAI API key for embeddings and completions
- `SUPABASE_URL`           # Supabase project URL
- `SUPABASE_ANON_KEY`      # Supabase anon/public key
- `RATE_LIMITER`           # Durable Object binding for rate limiting

See `wrangler.jsonc` for Cloudflare Worker and Durable Object configuration.

---

This project demonstrates Dave’s ability to design secure AI systems, backend services, and production-style engineering workflows.

---

## Problem
Traditional portfolios are static and require recruiters to manually navigate repositories and documentation.

Dave designed this assistant to:
- Provide interactive technical explanations
- Answer engineering questions about projects
- Prevent hallucinated or fabricated information
- Demonstrate real-world AI system design skills

---

## Architecture
The assistant follows a Retrieval-Augmented Generation architecture deployed on edge infrastructure.

High-level flow:

User Question  
→ Cloudflare Worker API  
→ Prompt Security Guard  
→ Vector Similarity Search (Supabase)  
→ Context Builder  
→ LLM Response Streaming  
→ Chat Interface

Key components:
- Cloudflare Workers for serverless edge execution
- Supabase vector database for semantic retrieval
- OpenAI embeddings for document vectorization
- GPT-4o-mini for grounded responses
- Streaming responses for improved UX

---

## Retrieval System Design
Portfolio documents such as project READMEs, resume data, and technical documentation are processed through a custom ingestion pipeline.

During ingestion Dave implemented:
- Document normalization
- Deterministic chunking
- SHA-256 file hashing
- Idempotent re-ingestion
- Batch embedding generation
- Metadata enrichment per chunk

Each document is split into semantic chunks and stored with embeddings to enable similarity-based retrieval.

---

## Context Construction
A custom Context Builder assembles retrieved documents before sending them to the language model.

Design goals:
- Deterministic truncation
- Prevent partial document corruption
- Prioritize high-value engineering evidence
- Maintain coherent technical context

Chunks are grouped by priority so architectural decisions and engineering impact appear first in responses.

---

## Security and Prompt Protection
Dave implemented multiple safeguards to prevent misuse and hallucinations.

Security measures include:
- Prompt injection filtering
- Retrieval validation guardrails
- Minimum similarity thresholds
- Context-only answering rules
- Sensitive information protection

The assistant cannot answer outside verified portfolio data.

---

## Engineering Decisions
Important design decisions include:
- Using edge workers to minimize latency
- Separating ingestion from runtime inference
- Avoiding LLM-based link detection
- Deterministic context assembly instead of random truncation
- Background logging using execution context tasks

These decisions reflect production-oriented system thinking.

---

## Skills Demonstrated
This project demonstrates experience with:
- Retrieval-Augmented Generation (RAG)
- LLM system architecture
- Backend API design
- Cloudflare Workers
- Vector databases
- AI security practices
- Performance optimization
- Automated ingestion pipelines

---

## Outcome
The result is an intelligent portfolio assistant capable of explaining Dave’s engineering work, architectural decisions, and technical experience in a reliable and secure manner.

The system itself serves as a live demonstration of Dave’s ability to design and implement modern AI-powered software systems.