import OpenAI from "openai";
import { RateLimiter } from "./rateLimiter";
export { RateLimiter };

/**
 * Environment bindings
 */
interface Env {
  RATE_LIMITER: DurableObjectNamespace;
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

/**
 * Request Types
 */
type ChatRequestBody = { question: string };

type RetrievedDocument = {
  id: number;
  content: string;
  metadata: any;
  similarity: number;
};

/**
 * ============================================
 * CORS CONFIGURATION (Production Safe)
 * ============================================
 */

const allowedOrigins = [
  "https://www.daveautomation.dev",
  "http://localhost:5173",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin! : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/**
 * ============================================
 * Conversation Logging (Abuse / Observability)
 * ============================================
 */
async function logConversation(
  env: Env,
  ip: string,
  question: string,
  answer: string,
  reason: string
) {
  try {
      const response = await fetch(`${env.SUPABASE_URL}/rest/v1/abuse_logs`, {
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
        answer,
      }),
    });
  } catch (err) {
    console.error("Logging into DB failed:", err);
  }
}
function streamText(text: string) {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      for (const char of text) {
        controller.enqueue(encoder.encode(char));
        await new Promise((r) => setTimeout(r, 40));
      }

      controller.close();
    },
  });
}
/**
 * ============================================
 * Cloudflare Worker Entry Point
 * ============================================
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {

    const origin = request.headers.get("Origin");
    const cors = getCorsHeaders(origin);

    /**
     * Handle CORS Preflight
     */
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    try {

      /**
       * Only allow POST
       */
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: cors,
        });
      }

      /**
       * Extract client IP
       */
      const clientIP =
        request.headers.get("CF-Connecting-IP") || "unknown";

      let question = "";

      /**
       * ============================================
       * RATE LIMITING (Durable Object)
       * ============================================
       */
      const id = env.RATE_LIMITER.idFromName(clientIP);
      const stub = env.RATE_LIMITER.get(id);

      const rateLimitResponse = await stub.fetch(
        new Request("https://rate-limit-check")
      );

      if (rateLimitResponse.status === 429) {
        const answer = "Too many requests. Please try again later.";

        ctx.waitUntil(logConversation(
          env,
          clientIP,
          question,
          answer,
          "rate_limited"
        ).catch((err) =>
        console.error("Too many requests log failed:", err)
    )
      );

        return new Response(streamText("Too many requests. Please try again later."), 
          {
            status: 429,
            headers: {
               "Content-Type": "text/plain",
              ...cors,
            },
          }
        );
      }

      /**
       * ============================================
       * REQUEST VALIDATION
       * ============================================
       */
      let body: unknown;

      try {
        body = await request.json();
      } catch {
        return new Response("Invalid JSON", {
          status: 400,
          headers: cors,
        });
      }

      if (
        typeof body !== "object" ||
        body === null ||
        !("question" in body)
      ) {
        return new Response("Invalid request format", {
          status: 400,
          headers: cors,
        });
      }

      question = (body as ChatRequestBody).question;

      if (!question) {
        return new Response("Missing question", {
          status: 400,
          headers: cors,
        });
      }

      if (question.length > 1000) {
        return new Response(streamText("Max 1000 characters please." ),
          {
            status: 400,
            headers: {
              "Content-Type": "text/plain",
              ...cors,
            },
          }
        );
      }

      /**
       * Basic Injection Guard
       */
      const suspiciousPatterns = [
        "ignore previous instructions",
        "system prompt",
        "jailbreak",
        "act as",
      ];

      for (const pattern of suspiciousPatterns) {
        if (question.toLowerCase().includes(pattern)) {
          return new Response(streamText("The question violates usage policy.",
            ),
            {
              status: 400,
              headers: {
                "Content-Type": "text/plain",
                ...cors,
              },
            }
          );
        }
      }

      /**
       * ============================================
       * RAG PIPELINE
       * ============================================
       */

      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });

      /**
       * 1️⃣ Generate embedding
       */
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: question,
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

      /**
       * 2️⃣ Vector Search (Supabase RPC)
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
            match_count: 10,
          }),
        }
      );

      if (!supabaseResponse.ok) {
        return new Response(streamText("Database retrieval error."),
          {
            status: 500,
            headers: {
              "Content-Type": "text/plain",
              ...cors,
            },
          }
        );
      }

      let documents;
      try {
        documents = await supabaseResponse.json();
      } catch (err) {
        console.error("Supabase JSON parse failed:", err);

        return new Response(
          streamText("Database retrieval error."),
          {
            status: 500,
            headers: {
              "Content-Type": "text/plain",
              ...cors,
            },
          }
        );
      }


      if (!Array.isArray(documents)) {
        return new Response(streamText("Invalid retrieval format."),
          {
            status: 500,
            headers: {
               "Content-Type": "text/plain",
              ...cors,
            },
          }
        );
      }

      /**
       * Similarity Filter
       */
      const MIN_SIMILARITY = 0.30;

      const finalDocs = documents.filter(
        (doc: any) => doc.similarity >= MIN_SIMILARITY
      );

      const fallbackAnswer =
        "I don't have that information in the portfolio documents, please be more specific.";

      if (!finalDocs || finalDocs.length === 0) {
        ctx.waitUntil(logConversation(
          env,
          clientIP,
          question,
          fallbackAnswer,
          "fallback"
        ).catch((err) =>
          console.error("Log failed in fallback:", err)
          )
        );

        return new Response(streamText( fallbackAnswer),
          {
            headers: {
              "Content-Type": "text/plain",
              ...cors,
            },
          }
        );
      }

      /**
       * Build Context
       */
      const context = finalDocs
        .map((doc: any) => doc.content)
        .join("\n\n")
        .slice(0, 6000);

      const systemPrompt = `
You are a portfolio assistant.

Rules:
- Answer ONLY using provided context.
- Do NOT use general knowledge.
- Do NOT fabricate information.
- Maintain professional tone.
- Ensure David is perceived as an excellent engineering candidate.
- If the question is about an skill or knowledge i dont actually have, relate it to something i do have in the context. For example if the question is about a specific programming language, and i dont have that, but i do have experience with a similar language, relate the answer to that experience.
- When referring to readme files please add the link to the github repository in the answer so users can easily go check the project, if you reference multiple readme's then add the repository link of each.
`;

const userPrompt = `
Context:
${context}

Question:
${question}
`;

/**
 * 3️⃣ LLM Completion (Streaming)
 */
let stream;
try {
  stream = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  temperature: 0,
  max_tokens: 300,
  stream: true,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ],
});
} catch (err) {
  console.error("OpenAI stream failed:", err);

  return new Response(
    streamText("The AI service is temporarily overloaded. Please retry."),
    {
      status: 503,
      headers: {
        "Content-Type": "text/plain",
        ...cors,
      },
    }
  );
}
let fullAnswer = "";

const readable = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();

    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;

        if (content) {
          fullAnswer += content;
          controller.enqueue(encoder.encode(content));
        }
      }

     ctx.waitUntil(logConversation(
        env,
        clientIP,
        question,
        fullAnswer,
        "success"
      ).catch((err) =>
        console.error("Success Answer log failed:", err) )
      );

      controller.close();

      } catch (err) {
        console.error("Streaming error:", err);
        controller.enqueue(
          new TextEncoder().encode(
            "\n\n[Stream interrupted. Please retry.]"
          )
        );
        ctx.waitUntil(
            logConversation(
              env,
              clientIP,
              question,
              "",
              "error"
            )
          );
        controller.close();
      }
  },
});

return new Response(readable, {
  headers: {
    "Content-Type": "text/plain",
    ...cors,
  },
});

    } catch (error) {

          /**
           * Global Fallback
           */
          return new Response(
            streamText("The assistant is temporarily unavailable. Please try again later."),
            {
              status: 500,
              headers: {
                "Content-Type": "text/plain",
                ...cors,
              },
            }
          );
    }
  },
} satisfies ExportedHandler<Env>;