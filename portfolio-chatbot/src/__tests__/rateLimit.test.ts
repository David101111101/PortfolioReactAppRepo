/**
 * Rate Limiting Regression Test (Artifact Based)
 * # 1 AM UTC every Wednesday (once a week)
 * Produces structured abuse-protection metrics for CI ingestion.
 * Purpose:
 * - Validates per-IP request throttling
 * - Ensures abuse protection is enforced
 * - Confirms HTTP 429 behavior when limit exceeded
 *
 * IMPORTANT:
 * - Do NOT run in parallel with other tests that hit the API 
 */

import { describe, it, expect, afterAll   } from "vitest";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const BASE_URL =
  process.env.API_BASE_URL ??
  "http://127.0.0.1:8787";
// Warmup counts as the first request within the rate limit window
const REQUEST_LIMIT = 13;
const RUN_ID = process.env.RUN_ID ?? randomUUID();

interface RateLimitRegressionMetric {
  run_id: string;
  test_id: "rate_limit_regression";
  test_name: string;
  total_requests: number;
  total_429: number;
  enforcement_rate: number;
  first_429_index: number;
  threshold_drift: number;
}

//Only runs if NIGHTLY env var is set to true, to avoid interference with other tests due to rate limiting.
describe.runIf(process.env.NIGHTLY === "true")("Rate Limiting (Artifact-Based)", () => {
  //Central artifact collector
  const metrics: RateLimitRegressionMetric[] = [];
  it("should block requests exceeding the per-IP limit", async () => {
    /** 
     * 0️⃣ Warm up worker + durable object
     */
    const testIP = fakeIP(12);
    await fetch(BASE_URL, {
      method: "POST",
      headers: testHeaders(testIP),
      body: JSON.stringify({
        question: "warm up request sent to start test",
        source: "home",
      }),
    });
    /**
     * 1️⃣ Send requests until limit triggers and track responses
     */
    const statuses: number[] = [];
    let first429Index = -1;
    for (let i = 0; i < REQUEST_LIMIT; i++) {
      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: testHeaders(testIP),
        body: JSON.stringify({
          question: "Testing rate limiting behavior",
          source: "home",
        }),
      });
      statuses.push(res.status);
      if (res.status === 429 && first429Index === -1) {
          first429Index = i;
      }
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
      headers: testHeaders(testIP), // Simulate same IP for testing
      body: JSON.stringify({
        question: "This should exceed the limit",
        source: "home",
      }),
    });
    expect(blockedResponse.status).toBe(429);
    /**
     * 4️⃣Validate response body shape
     */
    const body = await blockedResponse.text();
    expect(body.toLowerCase()).toContain("too many requests. please try again later.");
      //Derived signals
      const totalRequests = statuses.length;
      const total429 = statuses.filter(s => s === 429).length;

      const enforcementRate = total429 / totalRequests;

      /**
       * If limit is 10, first 429 should be around index ~10 which is when rate limit protection kicks in
      */
      const expectedThreshold = 10;
      const thresholdDrift =
        first429Index === -1
          ? Infinity
          : Math.abs(first429Index - expectedThreshold);

      // Store metrics in a structured format for CI ingestion and dashboarding
      metrics.push({
        run_id: RUN_ID,
        test_id: "rate_limit_regression",
        test_name: "should block requests exceeding the per-IP limit",
        total_requests: totalRequests,
        total_429: total429,                 //Consistency of enforcement
        enforcement_rate: enforcementRate, //Strength of blocking
        first_429_index: first429Index,   //When protection kicks in
        threshold_drift: thresholdDrift //Accuracy of limit enforcement
      });

      console.log("🚦 Rate limit metrics:", metrics[0]);
  }, 30000);

  
    /**
     * 🔥 Write artifact After all tests are complete
     */
    afterAll(() => {
      const dir = path.join(process.cwd(), "artifacts");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      const filePath = path.join(
        dir,
        `ratelimit-metrics-${RUN_ID}.json`
      );
      fs.writeFileSync(
        filePath,
        JSON.stringify(
          {
            run_id: RUN_ID,
            suite: "rate_limit_regression",
            metrics
          },
          null,
          2
        )
      );
      console.log("📦 Rate limit metrics artifact saved:", filePath);
    });

  }
);
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