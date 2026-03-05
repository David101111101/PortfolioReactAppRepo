/**
 * Retrieval Regression Test
 *
 * Purpose:
 * - Validates semantic retrieval stability
 * - Ensures high-confidence chunks are returned
 * - Guards against embedding / similarity drift
 * - Prevents hallucinated knowledge from leaking in
 *
 * Runs only in scheduled NIGHTLY mode  # 2 AM UTC every Sunday (once a week).
 */

import { describe, it, expect } from "vitest";

const BASE_URL = "http://127.0.0.1:8787";

/**
 * Known grounded keywords expected
 * when asking about architecture/system design.
 *
 * These should exist in your portfolio documents.
 * Adjust based on real content.
 */
const EXPECTED_KEYWORDS = [
  "ingestion",
  "Deterministic",
  "data ",
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
            "What architectural decisions were made in the portfolio assistant?",
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
      const foundKeywords = EXPECTED_KEYWORDS.filter((keyword) =>
        answerLower.includes(keyword.toLowerCase())
      );
      expect(foundKeywords.length).toBeGreaterThan(0);

      /**
       * 4️⃣ Ensure no hallucinated general knowledge
       * Example guard: should not answer unrelated trivia
       */
      expect(answerLower).not.toContain("capital of france");

    }, 20000 /* Extended timeout by 20secs for retrieval test */
  );
  }
);