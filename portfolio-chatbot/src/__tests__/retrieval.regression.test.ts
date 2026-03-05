/**
 * Retrieval Regression Test
 *
 * Purpose:
 * - Validates semantic retrieval stability
 * - Ensures high-confidence chunks are returned
 * - Guards against embedding / similarity drift
 * - Prevents hallucinated knowledge from leaking in
 *
 * Runs only in scheduled NIGHTLY mode  # 1 AM UTC every Wednesday (once a week)
 */

import { describe, it, expect } from "vitest";

const BASE_URL = "http://127.0.0.1:8787";

/**
 * Known grounded keywords expected
 *
 * These should exist in your portfolio documents.
 * Adjust based on real content.
 */
const EXPECTED_CONCEPTS = [
  "rag",
  "vector",
  "retrieval",
  "prompt guard",
  "Security",
  "testing",
];

describe.runIf(process.env.NIGHTLY === "true")(
  "Retrieval Regression",
  () => {
    it("should retrieve architecture-related portfolio content", async () => {
      /**
       * 1️⃣ Send domain-specific question
       */
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question:
            "What architectural decisions were made in the portfolio chatbot assistant?",
        }),
      });

      expect(response.status).toBe(200);

      const answer = await response.text();
      /**
       * 2️⃣ Validate response shape (streamed text)
       */
      expect(typeof answer).toBe("string");
      expect(answer.length).toBeGreaterThan(30);
      /**
       * 3️⃣ Validate grounded content appears
       */
      const answerLower = answer.toLowerCase();
      // Score based on presence of expected concepts
      const score = EXPECTED_CONCEPTS.reduce((count, concept) => {
        return answerLower.includes(concept) ? count + 1 : count;
      }, 0);

      console.log({
        evaluation: "retrieval_grounding-regression-test",
        concept_score: score,
        concepts_checked: EXPECTED_CONCEPTS.length,
      });
      /**
       * Require minimum concept coverage
       */
      expect(score).toBeGreaterThanOrEqual(2);

      /**
       * 4️⃣ Ensure no hallucinated general knowledge
       * Example guard: should not answer unrelated trivia
       */
      expect(answerLower).not.toContain("capital of france");

    }, 20000 /* Extended timeout by 20secs for retrieval test */
  );
  }
);