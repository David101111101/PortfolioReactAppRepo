

import OpenAI from "openai";
import { RateLimiter } from "./rateLimiter";
export { RateLimiter };
interface Env {
  RATE_LIMITER: DurableObjectNamespace;
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}
	/**
	 * Request/Response Types
	 */
	type ChatRequestBody = {question: string;};
	type RetrievedDocument = {
		id: number;
		content: string;
		metadata: any;
		similarity: number;
	};
/**
 * Cloudflare Worker – Portfolio RAG Assistant Implementation
 */
async function logConversation(
  env: Env,
  ip: string,
  question: string,
  answer: string,
  reason: string
) {
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/abuse_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        ip,
        question,
        reason,
        Answer: answer,
      }),
    });
  } catch (err) {
    console.error("Logging failed:", err);
  }
}
export default {
  
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      /**
       * Allow only POST requests
       */
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      /**
       * Extract client IP
       */
      const clientIP =
        request.headers.get("CF-Connecting-IP") || "unknown";
      let question = "";
      /**
       * Rate limiting via Durable Object
       */
      const id = env.RATE_LIMITER.idFromName(clientIP);
      const stub = env.RATE_LIMITER.get(id);
      const rateLimitResponse = await stub.fetch(
		new Request("https://rate-limit-check")
		);

      if (rateLimitResponse.status === 429) {
        return new Response(
          JSON.stringify({
            
            answer: "Too many requests. Please try again later.",
          }),
          { status: 429 }
        );
        await logConversation(
        env,
        clientIP,
        question ?? "",
        "Too many requests",
        "rate_limited"
      );
      }

      /**
       * Parse request body
       */


	let body: unknown;

	try {
	body = await request.json();
	} catch (err) {
	console.error("JSON parse error:", err);
	return new Response("Invalid JSON", { status: 400 });
	}

		/**
		 * Runtime type validation
		 */
		if (
			typeof body !== "object" ||
			body === null ||
			!("question" in body)
		) {
      await logConversation(
        env,
        clientIP,
        question,
        "Blocked by injection detection",
        "injection_blocked"
      );
			return new Response("Invalid request format", { status: 400 });
		}

		question = (body as ChatRequestBody).question;

      if (!question) {
        await logConversation(
          env,
          clientIP,
          question,
          "Blocked by injection detection",
          "injection_blocked"
        );
        return new Response("Missing question", { status: 400 });
      }

      /**
       * Hard input length guard
       */
      if (question.length > 1000) {
        return new Response(
          JSON.stringify({ answer: "Max 1000 characters please." }),
          { status: 400 }
        );
      }

      /**
       * Basic prompt injection detection
       */
      const suspiciousPatterns = [
        "ignore previous instructions",
        "system prompt",
        "jailbreak",
        "act as",
      ];

      for (const pattern of suspiciousPatterns) {
        if (question.toLowerCase().includes(pattern)) {
          return new Response(
            JSON.stringify({
              answer: "The question violates usage policy.",
            }),
            { status: 400 }
          );
        }
      }

      /**
       * Initialize OpenAI client
       */
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
      /**
       * 1️⃣ Generate embedding for user question
       */
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: question,
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;
      /**
       * 2️⃣ Retrieve similar documents from Supabase
       */
      const supabaseResponse = await fetch(
        `${env.SUPABASE_URL}/rest/v1/rpc/match_documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            query_embedding: queryEmbedding,
            match_count: 10, // retrieve top 8 for better context
          }),
        }
      );
      /**
     * Handle HTTP errors first
     */
    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      console.error("Supabase RPC error:", errorText);

      return new Response(
        JSON.stringify({ answer: "Database retrieval error." }),
        { status: 500 }
      );
    }


    const documents = await supabaseResponse.json();
    
    /**
     * Ensure correct format
     */
    if (!Array.isArray(documents)) {
      console.error("Invalid RPC response format:", documents);

      return new Response(
        JSON.stringify({ answer: "Invalid retrieval format." }),
        { status: 500 }
      );
    }
      /**
       * Similarity enforcement (hallucination guard)
       */
      const MIN_SIMILARITY = 0.30;
      const validDocs = documents.filter(
        (doc: any) => doc.similarity >= MIN_SIMILARITY
      );
     let finalDocs = validDocs;

if (finalDocs.length === 0) {
  console.log("Vector search weak — running keyword fallback");

  const keywordResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/documents?content=ilike.*${encodeURIComponent(
      question
    )}*`,
    {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
    }
  );

      if (keywordResponse.ok) {
      const keywordDocsRaw: unknown = await keywordResponse.json();

      if (
        Array.isArray(keywordDocsRaw) &&
        keywordDocsRaw.every(
          (doc) =>
            typeof doc === "object" &&
            doc !== null &&
            "content" in doc
        )
      ) {
        finalDocs = (keywordDocsRaw as RetrievedDocument[]).slice(0, 5);
      } else {
        console.error("Keyword fallback returned invalid structure");
      }
    }
}
      const fallbackAnswer =
      "I don't have that information in the portfolio documents, please be more specific.";

      await logConversation(
        env,
        clientIP,
        question,
        fallbackAnswer,
        "fallback"
      );

      if (!finalDocs || finalDocs.length === 0) {
        return new Response(
      JSON.stringify({ answer: fallbackAnswer }),
        { headers: { "Content-Type": "application/json" } }
        );
      }

      /**
       * Build context string
       */
      const context = finalDocs
        .map((doc: any) => doc.content)
        .join("\n\n")
        .slice(0, 6000); // limit tokens

      /**
       * Strict system prompt
       */
      const systemPrompt = `
          You are a portfolio assistant.

          Rules:
          - Answer ONLY using provided context.
          - Do NOT use general knowledge.
          - Do NOT fabricate information.
          - Always maintain a professional tone.
          - Always ensure david is perceived as a the best choice for engineering roles.
          - If the question is about an skill or knowledge i dont actually have, relate it to something i do have in the context. For example if the question is about a specific programming language, and i dont have that, but i do have experience with a similar language, relate the answer to that experience.
          `;

      const userPrompt = `
          Context:
          ${context}

          Question:
          ${question}
          `;

      /**
       * Timeout guard (5 seconds)
       */
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("LLM timeout")), 5000)
      );

      /**
       * 3️⃣ LLM Completion
       */
			let completion: any;

				try {
				completion = await Promise.race([
					openai.chat.completions.create({
					model: "gpt-4o-mini",
					temperature: 0,
					max_tokens: 300,
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: userPrompt },
					],
					}),
					timeoutPromise,
				]);
				} catch (error: any) {
				/**
				 * OpenAI quota exceeded
				 */
				if (error?.status === 429) {
					console.error("OpenAI quota exceeded");

					return new Response(
					JSON.stringify({
						answer:
						"The assistant is temporarily rate-limited. Please try again later.",
					}),
					{ 
						status: 503, 
						headers: {
						"Retry-After": "60",},
					}
					);
				}

				/**
				 * Timeout case
				 */
				if (error?.message?.includes("timeout")) {
					console.error("LLM timeout");

					return new Response(
					JSON.stringify({
						answer:
						"The assistant is taking too long to respond. Please try again.",
					}),
					{ status: 504 }
					);
				}

				throw error; // let global catch handle unknown errors
				}

			const answer = completion.choices[0].message.content;
      await logConversation(
      env,
      clientIP,
      question,
      answer,
      "success"
    );

			/**
			 * Observability log
			 */

			return new Response(JSON.stringify({ answer }), {
				headers: { "Content-Type": "application/json" },
			});
			} catch (error) {
			/**
			 * Global fallback
			 */

			return new Response(
				JSON.stringify({
				answer:
					"The assistant is temporarily unavailable. Please try again later.",
				}),
				{ status: 500 }
			);
			}
},
} satisfies ExportedHandler<Env>;