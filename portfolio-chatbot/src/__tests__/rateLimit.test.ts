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

const BASE_URL =
  process.env.API_BASE_URL ??
  "http://127.0.0.1:8787";
// Warmup counts as the first request within the rate limit window
const REQUEST_LIMIT = 13;
//Only runs if NIGHTLY env var is set to true, to avoid interference with other tests due to rate limiting.
// # 1 AM UTC every Wednesday (once a week)
describe.runIf(process.env.NIGHTLY === "true")("Rate Limiting", () => {
  it("should block requests exceeding the per-IP limit", async () => {
    /** 
     * 0️⃣ Warm up worker + durable object
     */
    await fetch(BASE_URL, {
      method: "POST",
      headers: testHeaders(fakeIP(12)),
      body: JSON.stringify({
        question: "warm up request sent to start test",
      }),
    });
    /**
     * 1️⃣ Send requests until limit should trigger
     */
    const statuses: number[] = [];
    for (let i = 0; i < REQUEST_LIMIT; i++) {
      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: testHeaders(fakeIP(12)),
        body: JSON.stringify({
          question: "Testing rate limiting behavior",
        }),
      });
      statuses.push(res.status);
      await new Promise(r => setTimeout(r, 50)); // Small delay to avoid hitting the limit too fast and not getting accurate 429 responses
    }
    /**
     * 2️⃣ Ensure rate limiting occured
     */
    expect(statuses.some(s => s === 429)).toBe(true);
    /**
     * 3️⃣ Additional requests should always be blocked
     */
      const blockedResponse = await fetch(BASE_URL, {
      method: "POST",
      headers: testHeaders(fakeIP(12)), // Simulate same IP for testing
      body: JSON.stringify({
        question: "This should exceed the limit",
      }),
    });
    expect(blockedResponse.status).toBe(429);
    /**
     * 4️⃣Validate response body shape
     */
    const body = await blockedResponse.text();
    expect(body.toLowerCase()).toContain("too many requests. please try again later.");
  }, 25000 /* Extended timeout by 16secs to account for potential delays in rate limit response */
);
});

function fakeIP(n: number) {
  return `203.0.113.${n}`;
}

function testHeaders(ip: string) {
  return {
    "Content-Type": "application/json",
    "x-test-ip": ip,
    "x-test-mode": "true",
    "x-test-namespace": "ratelimit"
  };
}