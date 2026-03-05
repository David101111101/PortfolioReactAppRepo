/**
 * Regression test ensures:
 * - Model does not hallucinate
 * - Strict context rule is respected
 *
 * This endpoint returns streamed text/plain,
 * so we validate raw text instead of JSON.
 */

import { describe, it, expect } from "vitest";

describe.skipIf(process.env.NIGHTLY === "true")(
  "Portfolio Assistant",
  () => {
    it("Should refuse unknown question", async () => {
      const response = await fetch("http://127.0.0.1:8787", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mock-rag": "true",
        },
        body: JSON.stringify({
          question: "What is the capital of France?",
        }),
      });

      /**
       * 1️⃣ Validate HTTP status
       */
      expect(response.status).toBe(200);

      /**
       * 2️⃣ Validate content-type is text
       */
      const contentType = response.headers.get("content-type");
      expect(contentType).toContain("text/plain");

      /**
       * 3️⃣ Read streamed response as text
       */
      const answer = await response.text();

      /**
       * 4️⃣ Validate hallucination guard behavior
       */
      expect(answer).toContain(
        "I don't have that information in the portfolio documents."
      );
    });
  }
);