Portfolio AI Chatbot Assistant Architecture
Overview

This portfolio includes a custom AI rag chatbot assistant designed and implemented by Dave to allow recruiters and engineers to interactively explore his projects, technical decisions, and engineering practices.

The assistant answers questions by retrieving verified information from Dave’s portfolio documentation and generating responses grounded in those documents.

This is not a generic AI chatbot. It is a Retrieval-Augmented Generation (RAG) system designed to provide reliable explanations about Dave’s engineering work while preventing hallucinated or fabricated information.

The assistant demonstrates Dave’s ability to design secure AI systems, backend services, and production-style engineering workflows.

The chatbot should be viewed as an interactive technical documentation interface for the portfolio.

Purpose of the Portfolio Assistant

Traditional developer portfolios are static. Recruiters must manually browse repositories, documentation, and project files.

Dave designed this system to:

• Allow recruiters to ask engineering questions interactively
• Provide technical explanations about architecture and design decisions
• Demonstrate backend system design and AI engineering skills
• Prevent hallucinated answers by grounding responses in verified documentation
• Showcase secure AI system implementation practices

The assistant functions as an AI interface to the portfolio documentation.

High Level System Architecture

The assistant follows a Retrieval-Augmented Generation architecture (rag)deployed on edge infrastructure.

High-level request flow:

User Question
→ Edge API (Cloudflare Worker)
→ Input Validation and Prompt Security Layer
→ Vector Similarity Search
→ Context Assembly
→ Language Model Generation
→ Streaming Response to UI

This architecture ensures responses are grounded in real portfolio content rather than model hallucination.

Core System Components
Edge API

The assistant backend is implemented using Cloudflare Workers, allowing the system to execute at the network edge for low-latency responses.

Edge execution provides:

• Fast response times
• Stateless serverless infrastructure
• Global availability
• Reduced operational complexity

The worker handles request validation, security checks, retrieval orchestration, and response streaming.

Vector Retrieval System

The system uses a vector database to retrieve relevant portfolio documentation.

Documents such as:

• Project READMEs
• Technical architecture explanations
• Resume and experience summaries
• Engineering documentation

are processed into vector embeddings.

When a user asks a question, the system retrieves semantically relevant document chunks before generating a response.

This ensures the language model answers only using verified information from the portfolio.

Language Model Layer

The language model generates responses using retrieved context.

The model does not answer freely. It receives structured context from the retrieval system and is instructed to respond strictly using that context.

Responses are streamed to the user interface to improve perceived responsiveness.

Retrieval System Design

Dave implemented a custom ingestion pipeline to prepare portfolio documents for retrieval.

The ingestion pipeline performs:

• Document normalization
• Deterministic chunking
• SHA-256 file hashing
• Idempotent document re-ingestion
• Batch embedding generation
• Metadata enrichment for each chunk

Each document is divided into semantic chunks that can be retrieved independently.

This allows the assistant to provide precise explanations of specific engineering decisions.

Context Construction

A custom Context Builder assembles retrieved document chunks before they are sent to the language model.

Design goals include:

• Deterministic truncation
• Preventing partial document corruption
• Prioritizing high-value engineering information
• Maintaining coherent technical context

Chunks are ranked so architectural explanations and technical evidence appear first in the generated response.

Security and Prompt Protection

The system includes multiple security layers designed to protect against misuse and malicious input.

Security safeguards include:

• Prompt injection detection
• Input validation and sanitization
• Pattern detection for malicious payloads
• Context-only answer enforcement
• Sensitive information protection rules

If suspicious input is detected, the system blocks the request before it reaches the language model.

These guardrails ensure the assistant only answers legitimate questions about the portfolio.

Early User-Agent Validation and Bot Traffic Rejection

The chatbot performs an early request-header validation step before deeper processing.

Requests with missing, malformed, or suspicious User Agent headers are rejected immediately. This helps block non-browser clients and  automated traffic before those requests can consume expensive system resources.

By filtering these requests at the edge of the request lifecycle, the architecture:

• Reduces malicious and abusive traffic reaching core services
• Lowers unnecessary pressure on the rate limiter
• Prevents avoidable load on retrieval and generation components
• Improves overall response consistency for legitimate users

This fast-fail strategy improves both security posture and runtime performance by stopping suspicious traffic as early as possible.

Origin Validation and CORS Enforcement

The chatbot also validates request origin and enforces strict CORS handling.

Requests from unknown or untrusted origins are blocked to prevent unauthorized cross-origin access attempts. Allowed origins are explicitly controlled so only expected client environments can call the assistant backend.

This origin control layer provides:

• Protection against unauthorized frontend integrations
• Reduced cross-origin abuse attempts
• Cleaner API boundaries between trusted and untrusted clients
• Stronger defense-in-depth for public-facing endpoints

Combined with prompt protection and header validation, origin filtering helps ensure only legitimate browser traffic from approved sources reaches the chatbot pipeline.

Secure Deployment and Configuration Management

Production deployment security is enforced through industry-standard secure communication and secrets management practices.

The system leverages:

SSH for Secure Communication — All infrastructure interactions, deployments, and configuration changes use SSH protocols to establish encrypted, authenticated connections. This ensures that sensitive operations between the CI/CD pipeline and cloud infrastructure cannot be intercepted or modified in transit.

GitHub Secrets for Credentials Management — API keys, database credentials, and other sensitive configuration values are stored securely using GitHub Secrets rather than being checked into version control. Secrets are injected into the deployment pipeline at runtime, ensuring sensitive credentials remain protected throughout the CI/CD process.

This defense-in-depth approach ensures that even if a part of the deployment pipeline is compromised, attackers cannot access credentials or establish unauthorized connections to production infrastructure.

Privacy and Data Handling

The assistant is designed with privacy-first principles.

The system does not collect personal user information.

Specifically, the assistant does not store:

• User IP addresses
• Email addresses
• Browser cookies
• Authentication data
• Account identifiers
• Personal profile information.

Conversations may be stored for:

• security monitoring
• debugging
• system reliability improvements

However these logs are designed to avoid storing personal identifiers.

The goal is to improve system quality while respecting user privacy.

If a user attempts to submit personal information, the system’s security layer blocks the request before processing.

Engineering Design Decisions

Several architectural decisions were made to ensure reliability, performance, and security of the Retrieval-Augmented Generation (RAG) ai chatbot.

Examples include:

Weekly nightly automated testing suit and CI/CD extensive testing covering security, performance, accessibility, privacy and more to ensure production quality
Strict context-only generation to drastically reduce hallucination risk and improve accuracy
Deterministic context assembly instead of random or light truncation
Implementing guardrails to detect malicious prompts
Separating document ingestion from runtime inference
Streaming responses to improve user experience
Conversation storing for continuous enhancements
Using edge compute to minimize latency

These decisions reflect production-style backend system thinking.


AI Testing and Reliability Engineering
The project includes a comprehensive automated testing strategy designed to ensure reliability.

Testing layers include:

Unit testing
Security validation testing
End-to-end interface testing
Retrieval regression testing
Performance benchmarking
Rate-limit enforcement testing

Nightly regression pipelines validate:

• retrieval accuracy
• system latency
• concurrency handling
• AI response quality

The system also collects telemetry such as latency measurements to monitor performance over time.

This testing strategy demonstrates how AI systems can be treated as reliable software infrastructure rather than experimental prototypes.

Skills Demonstrated

This project demonstrates expertise in:

Retrieval-Augmented Generation systems
AI system architecture
Backend API design
Edge computing
Vector databases
AI security practices
Performance optimization
Automated ingestion pipelines
AI testing and evaluation workflows
Continuous integration for AI systems

Outcome

The result is an intelligent portfolio assistant capable of explaining Dave’s projects, technical decisions, and engineering approach in an interactive way.

The system serves as a live demonstration of modern AI-powered software engineering practices.

Recruiters and engineers can use the assistant to explore Dave’s work, architecture decisions, and technical expertise through conversation rather than static documentation.

Technologies Used

This system uses a modern technology stack designed for scalability and reliability.

Cloudflare Workers – serverless edge runtime for backend logic
Supabase – managed backend and vector database platform
PostgreSQL – underlying database engine for document storage and retrieval
OpenAI language models – generation of grounded responses
OpenAI embeddings – semantic vectorization of portfolio documents
Wrangler – development and deployment tooling for Cloudflare Workers
TypeScript – strongly typed backend development
Node.js – ingestion pipeline runtime
SHA-256 – document integrity and change detection
Playwright – end-to-end UI testing
Vitest – unit testing and regression validation
Vite – frontend development tooling

These technologies enable a secure, scalable, and production-style AI assistant architecture.

 CI/CD Testing Strategy

To ensure production-grade reliability and quality, this project implements a comprehensive three-layer CI/CD testing strategy where I test API contracts, AI retrieval correctness, abuse protection, performance characteristics, and cross-browser reliability under controlled tiers.

1. Pull Request (PR) Quality Gate

- Runs unit backend testing suite:
	- contextBuilder
	- promptGuard
	- API Contract test
- Executes full end-to-end (E2E) suite in Chromium only
- Uploads test result artifacts
- Enforces Lighthouse performance thresholds
- Approves PR only if all verifications pass
- Writes a summary and posts it as a GitHub bot PR comment

2. Deploy Continuous Delivery (CD) Pipeline

- Runs unit backend testing suite:
	- contextBuilder
	- promptGuard
	- API Contract test
- Executes full E2E suite in parallel across Chromium, Firefox, and WebKit
- Uploads test result artifacts
- Summarizes test results in GitHub Actions CD
- Enforces Lighthouse performance thresholds
- Deploys only if all verifications pass

3. Weekly Nightly Deep Regression Run Deep AI + backend stability testing

- Scheduled GitHub Action (every Wednesday at 1am UTC)
- Runs unit backend testing suite:
	- Rate limit test
	- Performance regression tests
	- Retrieval regression test
- Uploads test result artifacts
- Detects LLM latency regressions
- Summarizes test results in GitHub Actions CD

This layered approach ensures that only high-quality, well-tested code is merged, deployed, and continuously validated in production-like conditions.
