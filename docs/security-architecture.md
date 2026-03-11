# AI Chatbot Security Architecture

## Description
This architecture demonstrates a defense-in-depth approach for a production-style RAG chatbot, combining edge protection, prompt safety, retrieval trust checks, and observable AI behavior. It is designed to show how QA automation engineering evolves into AI assurance by validating not only UI and API correctness, but also security and trustworthiness of model-driven flows.

## Objective
Showcase a practical security testing mindset for AI systems: prevent abusive input, constrain untrusted retrieval, reduce hallucination risk, and provide auditable signals that can be continuously validated through automated tests.

## Security Layers Diagram

```mermaid
flowchart LR
	subgraph Client[Client Layer]
		User[User]
		Browser[Browser SPA]
		ChatWidget[ChatWidget]
	end

	subgraph Edge[Security Layer: Cloudflare Worker]
		CORS[Origin and CORS Validation]
		RequestValidation[Request Schema Validation]
		RateLimit[Durable Object Rate Limiter]
		PromptGuard[Prompt Injection and PII Guard]
		SecurityDecision[Allow or Block Decision]
	end

	subgraph Retrieval[Retrieval Layer]
		QueryEmbedding[Query Embedding Generation]
		VectorSearch[Similarity Search RPC]
		RetrievalGuard[Similarity Threshold Guard]
		ContextBuilder[Priority Context Builder]
		Fallback[Safe Fallback Response]
	end

	subgraph Generation[Generation Layer]
		GroundedPrompt[Context Grounding Prompt]
		LLM[gpt-4o-mini Streaming Response]
		StreamClient[Client Stream Renderer]
	end

	subgraph Data[Data and Telemetry Layer]
		VectorDB[(Supabase pgvector documents)]
		AbuseLogs[(abuse_logs)]
		ConversationLogs[(conversation and reason logs)]
	end

	subgraph QALayer[QA Automation and AI Testing Layer]
		SecurityTests[Prompt Guard and Injection Tests]
		ContractTests[API Contract and Error Path Tests]
		RetrievalTests[Retrieval Regression and Threshold Tests]
		E2ETests[Playwright E2E Security Scenarios]
		PerfTests[Rate Limit and Performance Checks]
	end

	User --> Browser --> ChatWidget
	ChatWidget --> CORS --> RequestValidation --> RateLimit --> PromptGuard --> SecurityDecision

	SecurityDecision -->|allow| QueryEmbedding
	SecurityDecision -->|block| AbuseLogs

	QueryEmbedding --> VectorSearch --> VectorDB
	VectorDB --> RetrievalGuard
	RetrievalGuard -->|relevant| ContextBuilder --> GroundedPrompt --> LLM --> StreamClient --> ChatWidget
	RetrievalGuard -->|low confidence| Fallback --> ChatWidget

	PromptGuard --> AbuseLogs
	RetrievalGuard --> ConversationLogs
	LLM --> ConversationLogs

	SecurityTests -. validates .-> PromptGuard
	ContractTests -. validates .-> RequestValidation
	RetrievalTests -. validates .-> RetrievalGuard
	E2ETests -. validates .-> SecurityDecision
	PerfTests -. validates .-> RateLimit
```

## Why This Matters For QA Automation In AI

- Security is testable: each guardrail is mapped to an automatable checkpoint.
- AI quality is measurable: retrieval confidence and fallback behavior are asserted, not assumed.
- Risk is observable: abuse and conversation logs provide auditable evidence for incident triage.
- Shift-left AI assurance: security, reliability, and model-behavior checks are embedded into CI test strategy.