/**
 * Upload Metrics Script
 *
 * Reads artifact files and uploads:
 * - test_runs (1 per execution)
 * - retrieval_metrics
 * - test_results (per suite)
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RUN_ID = process.env.RUN_ID;

if (!SUPABASE_URL || !SUPABASE_KEY || !RUN_ID) {
  console.error("❌ Missing required env variables");
  process.exit(1);
}

const ARTIFACTS_DIR = path.join(process.cwd(), "artifacts");
async function insert(table, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Insert failed (${table}): ${res.status} ${text}`);
  }
}

/**
 * Read all artifact files
 */
function loadArtifacts() {
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    throw new Error("Artifacts folder not found");
  }

  const files = fs.readdirSync(ARTIFACTS_DIR);

  return files
    .filter(f => f.endsWith(".json"))
    .map(f => {
      const fullPath = path.join(ARTIFACTS_DIR, f);
      const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      return { file: f, ...content };
    });
}

/**
 * Create test_run (parent)
 */
async function createTestRun() {
  const payload = {
    id: RUN_ID,
    workflow_name: "regression_quality_gate",
    environment: process.env.CI ? "ci" : "local",
    commit_sha: process.env.GITHUB_SHA ?? "local",
    branch: process.env.GITHUB_REF_NAME ?? "local",
    total_tests: 0,
    passed: 0,
    failed: 0,
    flaky: 0,
    duration_seconds: 0,
    pass_rate: 0,
    reliability_score: 0,
    release_confidence: 0,
    workflow_type: process.env.WORKFLOW_TYPE ?? "unknown",
  };

  await insert("test_runs", payload);
  console.log("✅ test_run inserted:", RUN_ID);
}

/**
 * Upload retrieval metrics
 */
async function uploadRetrieval(metrics) {
  for (const m of metrics) {
    const payload = {
      run_id: RUN_ID,
      query: m.query,
      overlap_ratio: m.overlap_ratio,
      rank_shift: m.rank_shift,
      confidence: m.confidence
    };

    await insert("retrieval_metrics", payload);
  }
}

async function uploadRateLimit(metrics) {
  for (const m of metrics) {
    const payload = {
      run_id: RUN_ID,
      total_requests: m.total_requests,
      total_429: m.total_429,
      enforcement_rate: m.enforcement_rate,
      first_429_index: m.first_429_index,
      threshold_drift: m.threshold_drift
    };
    await insert("rate_limit_metrics", payload);
  }
}
/**
 * Upload test_results summary
 */
async function uploadTestResult(suite, metrics) {
  const status = "passed"; // since test already passed
  const duration = metrics.reduce(
  (acc, m) => acc + ((m.mean_latency || 0) * (m.sample_size || 0)),
  0
  );

  await insert("test_results", {
    run_id: RUN_ID,
    test_id: suite,
    suite,
    status,
    duration,
    failure_type: null,
    is_flaky: false
  });
}

/**
 * Compute reliability score across the regression suite
 */
function computeReliability(artifacts) {
  let retrievalScore = 100;
  let performanceScore = 100;
  let rateLimitScore = 100;

  for (const a of artifacts) {

    if (a.suite === "retrieval_regression") {
      for (const m of a.metrics) {
        if (m.overlap_ratio < 0.5) retrievalScore -= 15;
        if (m.rank_shift > 3) retrievalScore -= 15;
        if (m.confidence < 30) retrievalScore -= 10;
      }
    }

    if (a.suite === "performance_regression") {
      const m = a.metrics[0];
      if (m.degradation_ratio > 1.2) performanceScore -= 10;
      if (m.degradation_ratio > 1.5) performanceScore -= 10;

      if (m.p95_latency > 6000) performanceScore -= 10;
      if (m.p95_latency > 10000) performanceScore -= 10;
    }

    if (a.suite === "rate_limit_regression") {
      const m = a.metrics[0];
      if (m.enforcement_rate < 0.3) rateLimitScore -= 10;
      if (m.enforcement_rate < 0.1) rateLimitScore -= 10;
      if (m.threshold_drift > 1) rateLimitScore -= 10;
      if (m.threshold_drift > 3) rateLimitScore -= 10;
    }
  }
  
  return Math.max(
    Math.round(
      retrievalScore * 0.4 +
      performanceScore * 0.3 +
      rateLimitScore * 0.2 +
      10
    ),
    0
  );
}

async function uploadPerformance(metrics) {
  for (const m of metrics) {
    const payload = {
      run_id: RUN_ID,
      p95_latency: m.p95_latency,
      degradation_ratio: m.degradation_ratio,
      concurrent_p95: m.concurrent_p95
    };

    await insert("performance_metrics", payload);
  }
}

/**
 * Finalize test_run
 */
async function finalizeRun(artifacts) {
  const totalTests = artifacts.length;
  const passed = totalTests;

  const reliability = computeReliability(artifacts);

  const payload = {
    total_tests: totalTests,
    passed,
    failed: 0,
    flaky: 0,
    pass_rate: 100,
    reliability_score: reliability,
    release_confidence: reliability,
    workflow_type: process.env.WORKFLOW_TYPE ?? "unknown",
  };

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/test_runs?id=eq.${RUN_ID}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Finalize failed: ${res.status} ${text}`);
  }

  console.log("📊 Run finalized. Reliability:", reliability);
}

/**
 * MAIN
 */
async function main() {
  console.log("🚀 Uploading metrics...");

  const artifacts = loadArtifacts();

  await createTestRun();

  for (const artifact of artifacts) {
    if (artifact.suite === "retrieval_regression") {
      await uploadRetrieval(artifact.metrics);
    }
    if (artifact.suite === "performance_regression") {
    await uploadPerformance(artifact.metrics);
    }
    if (artifact.suite === "rate_limit_regression") {
      await uploadRateLimit(artifact.metrics);
    }
    await uploadTestResult(artifact.suite, artifact.metrics);
  }

  await finalizeRun(artifacts);

  console.log("✅ Upload complete");
}

main().catch(err => {
  console.error("❌ Upload failed:", err);
  process.exit(1);
});