/**
 * Rate Limiting Integration Test
 *
 * Purpose:
 * - Validates per-IP request throttling
 * - Ensures abuse protection is enforced
 * - Confirms HTTP 429 behavior when limit exceeded
 *
 * This test assumes:
 * - Limit = 10 requests per minute
 * - Worker running locally
 *
 * IMPORTANT:
 * - Do NOT run in parallel with other tests that hit the API
 * - Should run in isolation
 */

import { describe, it, expect } from "vitest";

const BASE_URL = "http://127.0.0.1:8787";

// Adjust if your rate limit differs, my max is 10 res per min
const REQUEST_LIMIT = 10;
//Only runs if NIGHTLY env var is set to true, to avoid interference with other tests due to rate limiting.
// # 2 AM UTC every Sunday (once a week)
describe.runIf(process.env.NIGHTLY === "true")("Rate Limiting", () => {
  it("should block requests exceeding the per-IP limit", async () => {

    /**
     * 1️⃣ Send allowed number of requests
     */
    for (let i = 0; i < REQUEST_LIMIT; i++) {
      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json",
        "CF-Connecting-IP": "nightly-rate-test", }, // Simulate same IP for testing
        body: JSON.stringify({
          question: "Test rate limiting behavior",
        }),
      });

      expect(res.status).toBe(200);
    }

    /**
     * 2️⃣ Send one additional request (should be blocked)
     */
    const blockedResponse = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", 
         "CF-Connecting-IP": "nightly-rate-test", }, // Simulate same IP for testing
      body: JSON.stringify({
        question: "This should exceed the limit",
      }),
    });

    /**
     * 3️⃣ Validate 429 status
     */
    expect(blockedResponse.status).toBe(429);

    /**
     * 4️⃣ Optional: Validate response body shape
     */
    const body = await blockedResponse.text();
    expect(body.toLowerCase()).toContain("too many requests. please try again later.");
  }, 16000 /* Extended timeout by 16secs to account for potential delays in rate limit response */
);
});