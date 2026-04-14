/**
 * Advanced Performance Regression Test (Artifact Based)
 * Produces structured latency + concurrency metrics for CI ingestion.
 * Runs only in scheduled run mode  # 1 AM UTC every Wednesday (once a week)
 *
 * Validates:
 * - Sequential latency stability (P95 threshold)
 * - Basic concurrency behavior
 * - Functional correctness under light parallel load
 *
 */

import { describe, it, expect, afterAll  } from "vitest";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const BASE_URL =
  process.env.API_BASE_URL ?? "http://127.0.0.1:8787";
const RUN_ID = process.env.RUN_ID ?? randomUUID();
const MAX_LATENCY_MS =
  process.env.NIGHTLY === "true" ? 8000 : 6000; // CI runners are slower
const SAMPLE_SIZE = 5;
const CONCURRENT_REQUESTS = 3;

interface PerformanceRegressionMetric {
  run_id: string;
  test_id: "performance_regression";
  test_name: string;
  sample_size: number;
  concurrent_requests: number;
  min_latency: number;
  median_latency: number;
  mean_latency: number;
  p95_latency: number;
  max_latency: number;
  concurrent_p95: number;
  degradation_ratio: number;
  latency_samples: number[];
  concurrent_latency_samples: number[];
}

describe.runIf(process.env.NIGHTLY === "true")(
  "Performance Regression Suite (Artifact Metrics Generation)",
  () => {
    //Central artifact collector
    const metrics: PerformanceRegressionMetric[] = [];
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
      const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const median = durations[Math.floor(durations.length / 2)];
      /**
       * 3️⃣ Calculate P95 latency
       */
      const p95 = durations[Math.floor(durations.length * 0.95)];
      /**
      * Validate performance threshold
      */

      // Primary signal (most important)
      expect(p95).toBeLessThan(MAX_LATENCY_MS * 1.1);
      // Median = sanity check (not strict)
      expect(median).toBeLessThan(MAX_LATENCY_MS * 1.15);
      // spike protection
      expect(max).toBeLessThan(MAX_LATENCY_MS * 1.5);
      /**
       * 4️⃣ Concurrency Simulation
       *     Light parallel load to ensure no blocking or race issues.
       */
      const concurrentResults = await Promise.all(
        Array.from({ length: CONCURRENT_REQUESTS }).map(async (_, i) => {
          const start = Date.now();
          const res= await fetch(BASE_URL, {
            method: "POST",
            headers: testHeaders(fakeIP(150 + i)), // Simulate same IP for testing
            body: JSON.stringify({
              question: "Describe your system architecture briefly.",
            }),
          });
          const duration = Date.now() - start;
          return {
            status: res.status,
            duration,
          };
        })
      );
      // Validate all responses succeeded
      for (const r of concurrentResults) {
        expect(r.status).toBe(200);
      }

      // Extract durations cleanly
      const concurrentDurations = concurrentResults.map(r => r.duration);

      const concurrentP95 = concurrentDurations[Math.floor(concurrentDurations.length * 0.95)];
      //Degradation constraint for concurrent load (should not degrade more than 50% compared to sequential P95)
      expect(concurrentP95).toBeLessThan(p95 * 1.5);
      //Store metrics 
      metrics.push({
        run_id: RUN_ID,
        test_id: "performance_regression",
        test_name: "should maintain acceptable P95 latency and handle light concurrency",
        sample_size: SAMPLE_SIZE,
        concurrent_requests: CONCURRENT_REQUESTS,

        // sequential stats
        min_latency: min,
        median_latency: median,
        mean_latency: Math.round(mean),
        p95_latency: p95,
        max_latency: max,

        // concurrency stats
        concurrent_p95: concurrentP95,

        // derived signal
        degradation_ratio: concurrentP95 / p95,
        latency_samples: durations,
        concurrent_latency_samples: concurrentDurations
      });

      console.log("📊 Performance metrics:", metrics[0]);

    }, 60000);

    //  Write artifact ONCE after all tests complete
    afterAll(() => {
      const dir = path.join(process.cwd(), "artifacts");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      const filePath = path.join(
        dir,
        `performance-metrics-${RUN_ID}.json`
      );
      fs.writeFileSync(
        filePath,
        JSON.stringify(
          {
            run_id: RUN_ID,
            suite: "performance_regression",
            metrics
          },
          null,
          2
        )
      );
      console.log("📦 Performance metrics artifact saved:", filePath);
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
    "x-test-namespace": "performance"
  };
}