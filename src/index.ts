/**
 * Cloudflare Worker RAG endpoint
 * This handles:
 * - Embedding
 * - Vector search
 * - Strict prompt construction
 * - LLM call
 * - Observability logging
 */

import OpenAI from "openai";

export default {
  async fetch(request: Request, env: any) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { question } = await request.json();

    if (!question) {
      return new Response("Missing question", { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    try {
      /**
       * 1. Embed user question
       */
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: question,
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

      /**
       * 2. Call Supabase RPC to retrieve relevant chunks
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
            match_threshold: 0.75,
            match_count: 5,
          }),
        }
      );

      const documents = await supabaseResponse.json();

      /**
       * Fallback: No relevant context
       */
      if (!documents || documents.length === 0) {
        return new Response(
          JSON.stringify({
            answer:
              "I don't have information about that in the portfolio documents.",
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      /**
       * 3. Build strict prompt
       */
      const context = documents.map((d: any) => d.content).join("\n\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0, // Deterministic for regression testing
        messages: [
          {
            role: "system",
            content: `
You are a portfolio assistant.

Rules:
- Answer ONLY using provided context.
- If the answer is not explicitly in the context, say:
  "I don't have that information in the portfolio documents."
- Do NOT use general knowledge.
- Do NOT fabricate information.
            `,
          },
          {
            role: "user",
            content: `
Context:
${context}

Question:
${question}
            `,
          },
        ],
      });

      const answer = completion.choices[0].message.content;

      /**
       * Basic observability log
       */
      console.log(
        JSON.stringify({
          question,
          contextCount: documents.length,
          timestamp: new Date().toISOString(),
        })
      );

      return new Response(JSON.stringify({ answer }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      /**
       * Fallback for runtime errors
       */
      console.error("Error:", error);

      return new Response(
        JSON.stringify({
          answer:
            "The assistant is temporarily unavailable. Please try again later.",
        }),
        { status: 500 }
      );
    }
  },
};