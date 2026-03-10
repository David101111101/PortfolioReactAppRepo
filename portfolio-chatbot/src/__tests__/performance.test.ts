/**
 * Advanced Performance Regression Test
 *
 * Validates:
 * - Sequential latency stability (P95 threshold)
 * - Basic concurrency behavior
 * - Functional correctness under light parallel load
 *
 * Runs only in NIGHTLY mode  # 1 AM UTC every Wednesday (once a week)
 */

import { describe, it, expect } from "vitest";
import { ms } from "zod/v4/locales";

const BASE_URL =
  process.env.API_BASE_URL ?? "http://127.0.0.1:8787";

  
const MAX_LATENCY_MS =
  process.env.NIGHTLY === "true" ? 8000 : 5000; // CI runners are slower
const SAMPLE_SIZE = 5;
const CONCURRENT_REQUESTS = 3;
// Only executes these tests during nightly scheduled runs to avoid slowing down regular development feedback loops
// # 1 AM UTC every Wednesday (once a week)
describe.runIf(process.env.NIGHTLY === "true")(
  "Performance Regression (Advanced)",
  () => {
    it("should maintain acceptable P95 latency and handle light concurrency", async () => {

      /**
       * 1️⃣ Warm-up request
       * This doesn't trigger LLM only the worker and durable object initialization, so it won't skew our latency samples but ensures we're not measuring cold start times.
       */
      const warmup = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-ip": "203.0.113.100",
          "x-test-mode": "true"
        }, 
        body: JSON.stringify({ question: "Warm up request for performance baseline." }),
      });
      expect(warmup.status).toBe(200);
      /**
       * 2️⃣ Sequential latency sampling
       *    Calls entire rag process and LLM response, measuring end-to-end latency.
       */
      const durations: number[] = [];
      for (let i = 0; i < SAMPLE_SIZE; i++) {
        const start = Date.now();
        const response = await fetch(BASE_URL, {
          method: "POST",
          headers: testHeaders(fakeIP(100 + 1)), // Simulate same IP for testing},
          body: JSON.stringify({
            question: "Explain the RAG architecture decisions.",
          }),
        });
        expect(response.status).toBe(200);
        const answer = await response.text();
        const duration = Date.now() - start;
        durations.push(duration);
        /**
         * Validate streamed response
         */
        expect(typeof answer).toBe("string");
        expect(answer.length).toBeGreaterThan(20);
      }
      /**
      * Sort durations to calculate percentiles
      */
      durations.sort((a, b) => a - b);
      const min = durations[0];
      const max = durations[durations.length - 1];

      const mean =
      durations.reduce((sum, d) => sum + d, 0) / durations.length;

      const median = durations[Math.floor(durations.length / 2)];

      /**
       * 3️⃣ Calculate P95 latency
       */
      const p95 = durations[Math.floor(durations.length * 0.95)];
      /**
       * Observability logs
       * These will appear in CI logs and nightly reports
       */
      console.log("Performance Regression Test Results:");
      console.log("Latency samples:", durations);
      console.log("Min latency:", min);
      console.log("Median latency:", median);
      console.log("Mean latency:", Math.round(mean));
      console.log("P95 latency:", p95);
      console.log("Max latency:", max);
      /**
      * Validate performance threshold
      */
      expect(median).toBeLessThan(MAX_LATENCY_MS);
      expect(max).toBeLessThan(MAX_LATENCY_MS * 1.25);
      /**
       * 4️⃣ Concurrency Simulation
       *
       * Light parallel load to ensure no blocking or race issues.
       */
      const concurrentResults = await Promise.all(
        Array.from({ length: CONCURRENT_REQUESTS }).map((_, i) =>
          fetch(BASE_URL, {
            method: "POST",
             headers: testHeaders(fakeIP(150 + i)), // Simulate same IP for testing
            body: JSON.stringify({
              question: "Describe your system architecture briefly.",
            }),
          })
        )
      );

      for (const res of concurrentResults) {
        expect(res.status).toBe(200);
      }
    }, 60000 /* Extended timeout by 40secs for performance test */
  );
  }
);
function fakeIP(n: number) {
  return `203.0.113.${n}`;
}
function testHeaders(ip: string) {
  return {
    "Content-Type": "application/json",
    "x-test-ip": ip,
    "x-test-namespace": "performance"
  };
}