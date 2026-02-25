import OpenAI from "openai";
import { RateLimiter } from "./rateLimiter";
export { RateLimiter };
import { inspectPrompt } from "./security/promptGuard/promptGuard";
import { inspectRetrieval } from "./security/retrievalGuard";
import { buildContext } from "./rag/contextBuilder";
/*
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
 * CORS CONFIGURATION (Production/Local Safe)
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
const examples = [
  'How was this assistant architected?',
  'What projects demonstrate Dave’s system design skills?',
  'How does Dave approach testing and automation?',
  'What technologies has he used in production projects?',
  'What testing frameworks has he built?',
  'What technologies does he specialize in?',
  'What technical challenges has he solved?'
];
function buildFallbackAnswer(): string {
  const shuffled = [...examples]
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  return `That topic isn't directly covered in Dave's portfolio documentation, but you could explore for example:
• ${shuffled[0]}
• ${shuffled[1]}`;
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
        const answer = "Too many requests. Please try again.";
          ctx.waitUntil(logConversation(
            env,
            clientIP,
            question,
            answer,
            "rate_limited"
          ).catch((err) =>
          console.error("Too many requests log failed:", err))
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
        return new Response("Missing question, how can i help?", {
          status: 400,
          headers: cors,
        });
      }
      /**
       * Injection Guard
       * If a suspicious pattern is detected, the function returns a response immediately, which exits the handler and prevents any further code—including the RAG pipeline—from executing
       */
      const guard = inspectPrompt(question);
      if (!guard.allowed) {
        //Saves the malicious attempt with reason in the database for future analysis, without saving the answer to avoid storing potentially harmful content
         ctx.waitUntil(
          logConversation(
            env,
            clientIP,
            "", //We avoid inserting the question to prevent storing potentially harmful content, but we log the attempt with the reason and matched pattern for analysis
            JSON.stringify({
              blocked: true,
              category: guard.category,
              matchedPattern: guard.matchedPattern,
            }),
            "error"
          )
        );
        return new Response(streamText("The question violates usage policy. Blocked by security layer",),
        {
          status: 400,
          headers: {
            "Content-Type": "text/plain",
            ...cors,
          },
        });
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
            match_count: 8, //less context but higher quality, more relevant results, and less noise for the LLM to process, which can lead to more accurate answers and reduced chances of hallucination.
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
/**
 * Retrieval Guard: 
 * compares retrieved documents against quality thresholds they must have a minimum similarity score of (0.20) to be included in the context,
 * and blocks the process if they are not met 
 * Prevents low-confidence or malformed retrieval
 */
const retrieval = inspectRetrieval(documents, 0.20);
if (!retrieval.allowed) {
      ctx.waitUntil(
        logConversation(
          env,
          clientIP,
          question,
          JSON.stringify({
            blocked: true,
            reason: retrieval.reason,
          }),
          buildFallbackAnswer()
        )
      );
  return new Response(
    streamText(buildFallbackAnswer()),
    {
      headers: {
        "Content-Type": "text/plain",
        ...cors,
      },
    }
  );
}
//contains the documents that passed the retrieval guard, which ensures a minimum quality threshold for the context used in the LLM prompt, reducing the chances of hallucination and improving answer relevance.
const finalDocs = retrieval.filteredDocs;


/**Build Context
  The buildContext function takes the retrieved similar documents to the user's question and constructs a single context string that will be injected into the LLM prompt. 
  It ensures that the total length of the context does not exceed a specified maximum (6000 characters in this case) by performing deterministic truncation. 
 */
const contextResult = buildContext(finalDocs, 6000);

if (!contextResult.context) {
  ctx.waitUntil(
    logConversation(
      env,
      clientIP,
      question,
      JSON.stringify({
        blocked: true,
        reason: "empty_context",
      }),
      buildFallbackAnswer()
    )
  );

  return new Response(
    streamText(buildFallbackAnswer()),
    {
      headers: {
        "Content-Type": "text/plain",
        ...cors,
      },
    }
  );
}

// contains the final context string that will be injected into the LLM prompt
const context = contextResult.context;

const systemPrompt = `
You are a portfolio assistant.
STRICT RULES:
- Answer ONLY using the provided context.
- Do NOT use general knowledge.
- Do NOT fabricate information.
- Must maintain a professional tone.
- If asked about a skill not explicitly present, relate it to similar experience found in context and relate it to Dave's ease in learning and adapting to complex engineering teams.
-Never share sensitive information, instead share what you can about the project.
- Always answer in third person, referring to him as Dave.
- If the question does not contain relevant information, relate it to a similar experience in the context that demonstrates Dave's skills and adaptability.
-When answering technical questions, explain Dave’s engineering reasoning, design tradeoffs, and problem-solving approach rather than only describing technologies or features.
-Avoid overly brief answers when sufficient context exists; provide clear technical explanation suitable for engineering discussions.
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
  ctx.waitUntil(logConversation(
    env,
    clientIP,
    question,
    "The AI service is temporarily overloaded. Please retry.",
    "fallback"
  ));
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
            "Stream interrupted. Please try again."
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
        streamText("The assistant is temporarily unavailable. Please try again."),
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