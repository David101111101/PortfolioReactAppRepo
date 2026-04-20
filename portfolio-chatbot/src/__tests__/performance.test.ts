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
  process.env.NIGHTLY === "true" ? 6000 : 5500; // TTFC threshold (RAG pipeline + LLM time-to-first-token)
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
        body: JSON.stringify({ question: "Warm up request for performance baseline.", source: "home" }),
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
            source: "home",
          }),
        });
        expect(response.status).toBe(200);
        /**
         * Drain the stream, stopping the clock at the first non-empty chunk.
         * This measures Time-to-First-Chunk (TTFC): how long until the LLM
         * starts responding — not how long the full answer takes to stream.
         */
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let fullAnswer = "";
        let ttfc: number | null = null;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (ttfc === null && chunk.length > 0) {
            ttfc = Date.now() - start; // clock stops at first LLM token
          }
          fullAnswer += chunk;
        }
        fullAnswer += decoder.decode(); // flush remaining bytes
        const duration = ttfc ?? (Date.now() - start);
        durations.push(duration);
        /**
         * Validate streamed response
         */
        expect(typeof fullAnswer).toBe("string");
        expect(fullAnswer.length).toBeGreaterThan(20);
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
          const res = await fetch(BASE_URL, {
            method: "POST",
            headers: testHeaders(fakeIP(150 + i)), // Simulate same IP for testing
            body: JSON.stringify({
              question: "Describe your system architecture briefly.",
              source: "home",
            }),
          });
          // Drain stream, stopping the clock at first chunk (TTFC)
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let ttfc: number | null = null;
          let text = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (ttfc === null && chunk.length > 0) ttfc = Date.now() - start;
            text += chunk;
          }
          text += decoder.decode();
          return {
            status: res.status,
            duration: ttfc ?? (Date.now() - start),
            text,
          };
        })
      );
      // Validate all responses succeeded and returned content
      for (const r of concurrentResults) {
        expect(r.status).toBe(200);
        expect(r.text.length).toBeGreaterThan(20);
      }

      // Extract and sort durations (required for correct percentile calculation)
      const concurrentDurations = concurrentResults.map(r => r.duration);
      concurrentDurations.sort((a, b) => a - b);

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