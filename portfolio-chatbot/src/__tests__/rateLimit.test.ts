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

// Because we do a warm up call that one counts as 10 and then the 11th one should be blocked as limit passed.
const REQUEST_LIMIT = 9;
//Only runs if NIGHTLY env var is set to true, to avoid interference with other tests due to rate limiting.
// # 1 AM UTC every Wednesday (once a week)
describe.runIf(process.env.NIGHTLY === "true")("Rate Limiting", () => {
  it("should block requests exceeding the per-IP limit", async () => {
    /** 
     * 0️⃣ Warm up worker + durable object
     */
    await fetch(BASE_URL, {
      method: "POST",
      headers: testHeaders("10.0.0.1"),
      body: JSON.stringify({
        question: "warm up request sent to start test",
      }),
    });
    /**
     * 1️⃣ Send allowed number of requests
     */
      const allowedResponses = await Promise.all(
        Array.from({ length: REQUEST_LIMIT }).map(() =>
          fetch(BASE_URL, {
            method: "POST",
            headers: testHeaders("10.0.0.1"),
            body: JSON.stringify({
              question: "Test rate limiting behavior with 10 requests",
            }),
          })
        )
      );

      for (const res of allowedResponses) {
        expect(res.status).toBe(200);
      }

    /**
     * 2️⃣ Send one additional request (should be blocked)
     */
    const blockedResponse = await fetch(BASE_URL, {
      method: "POST",
      headers: testHeaders("10.0.0.1"), // Simulate same IP for testing
      body: JSON.stringify({
        question: "This should exceed the limit",
      }),
    });

    /**
     * 3️⃣ Validate 429 status
     */
    expect(blockedResponse.status).toBe(429);

    /**
     * 4️⃣Validate response body shape
     */
    const body = await blockedResponse.text();
    expect(body.toLowerCase()).toContain("too many requests. please try again later.");
  }, 16000 /* Extended timeout by 16secs to account for potential delays in rate limit response */
);
});
function testHeaders(ip: string) {
  return {
    "Content-Type": "application/json",
    "CF-Connecting-IP": ip,
    "Origin": "http://localhost:5173"
  };
}