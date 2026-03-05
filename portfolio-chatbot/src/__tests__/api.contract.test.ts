/**
 * API Contract Test
 *
 * Purpose:
 * - Ensures backend response shape remains stable
 * - Protects frontend from breaking changes
 * - Validates HTTP semantics (status + content type)
 * - Enforces runtime schema using Zod
 *
 * This is NOT testing model quality.
 * This is testing API stability.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Define strict schema for API response.
 *
 * If the backend changes response structure,
 * this test will fail immediately.
 */
const ApiResponseSchema = z.object({
  answer: z.string().min(1), // must be non-empty string
});

/**
 * Base URL for local worker.
 *
 * IMPORTANT:
 * - Worker must be running locally before executing this test
 * - Typically: `npm run dev` inside portfolio-chatbot
 */
const BASE_URL = "http://127.0.0.1:8787";
//Does not run these tests in nightly deep regression suit
describe.skipIf(process.env.NIGHTLY === "true")("API Contract", () => {
  it("should return valid response structure", async () => {
    let response
    try {
     response = await fetch("http://127.0.0.1:8787", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-mode": "true", // 🔥 Enables contract bypass during CI through unit tests
      },
      body: JSON.stringify({
        question: "What projects demonstrate system design?",
      }),
    });

    } catch (err) {
       throw new Error(
          `Could not connect to API  ${err}`
        );
      throw err;
    }

    // 1️⃣ Validate HTTP status
    expect(response.status).toBe(200);

    // 2️⃣ Validate content type
    const contentType = response.headers.get("content-type");
    expect(contentType).toContain("application/json");

    // 3️⃣ Parse JSON safely
    const data = await response.json();

    // 4️⃣ Validate runtime schema
    const parsed = ApiResponseSchema.parse(data);

    // 5️⃣ Additional explicit validation
    expect(typeof parsed.answer).toBe("string");
    expect(parsed.answer.length).toBeGreaterThan(0);
  });
});