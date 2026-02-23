/**
 * Regression test ensures:
 * - Model does not hallucinate
 * - Strict context rule is respected
 */

import { describe, it, expect } from "vitest";
import fetch from "node-fetch";

describe("Portfolio Assistant", () => {
  it("Should refuse unknown question", async () => {
    const response = await fetch("http://localhost:8787", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "What is the capital of France?",
      }),
    });

    const data = await response.json();

    expect(data.answer).toContain(
      "I don't have that information in the portfolio documents."
    );
  });
});