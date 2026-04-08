/**
 * E2E Metrics Ingestion Script
 *
 * Reads playwright-artifacts/*.json (written by e2e/fixtures/test.ts afterAll hooks)
 * and pushes to Supabase: one test_runs parent + one test_results row per test.
 *
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RUN_ID        = process.env.RUN_ID;
const WORKFLOW_TYPE = process.env.WORKFLOW_TYPE ?? "unknown";
const BROWSER       = process.env.PLAYWRIGHT_BROWSER ?? "unknown";
const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR
  ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "playwright-artifacts");

if (!SUPABASE_URL || !SUPABASE_KEY || !RUN_ID) {
  console.error("❌ Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RUN_ID");
  process.exit(1);
}

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

function loadArtifacts() {
  if (!fs.existsSync(ARTIFACTS_DIR)) {
    console.warn(`⚠️ No playwright-artifacts dir at ${ARTIFACTS_DIR} — skipping ingestion`);
    return [];
  }
  return fs.readdirSync(ARTIFACTS_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => JSON.parse(fs.readFileSync(path.join(ARTIFACTS_DIR, f), "utf-8")));
}

function computeReliability(metrics) {
  if (!metrics.length) return 0;
  const passRate  = metrics.filter(m => m.status === "passed").length / metrics.length;
  const flakyRate = metrics.filter(m => m.is_flaky).length / metrics.length;
  const allPassed = !metrics.some(m => m.status === "failed" || m.status === "timedOut");
  return Math.round(((passRate * 0.7) + ((1 - flakyRate) * 0.2) + (allPassed ? 0.1 : 0)) * 100);
}

async function main() {
  console.log("🚀 Ingesting E2E metrics...");

  const artifacts = loadArtifacts();
  if (!artifacts.length) {
    console.log("No E2E artifacts found — skipping upload");
    return;
  }

  // Merge all artifact files (smoke + navigation + a11y) into one set
  const all     = artifacts.flatMap(a => a.metrics);
  const passed  = all.filter(m => m.status === "passed").length;
  const failed  = all.filter(m => m.status === "failed" || m.status === "timedOut").length;
  const flaky   = all.filter(m => m.is_flaky).length;
  const totalMs = all.reduce((s, m) => s + (m.duration_ms ?? 0), 0);
  const passRate    = all.length ? Math.round((passed / all.length) * 100) : 0;
  const reliability = computeReliability(all);

  // 1. Create test_runs parent entry
  await insert("test_runs", {
    id: RUN_ID,
    workflow_name: `e2e_${BROWSER}`,
    environment: process.env.CI ? "ci" : "local",
    commit_sha: process.env.GITHUB_SHA ?? "local",
    branch: process.env.GITHUB_REF_NAME ?? "local",
    total_tests: all.length,
    passed,
    failed,
    flaky,
    duration_seconds: Math.round(totalMs / 1000),
    pass_rate: passRate,
    reliability_score: reliability,
    release_confidence: reliability,
    workflow_type: WORKFLOW_TYPE,
  });
  console.log("✅ test_run inserted:", RUN_ID);

  // 2. Insert one test_results row per test
  for (const m of all) {
    await insert("test_results", {
      run_id: RUN_ID,
      test_id: m.test_id,
      suite: m.suite_name,
      status: m.status,
      duration: m.duration_ms,
      failure_type: m.failure_type,
      is_flaky: m.is_flaky,
      workflow_type: WORKFLOW_TYPE,
      test_name: m.test_name,
    });
  }

  console.log(`✅ ${all.length} test_results inserted`);
  console.log(`📊 Reliability score: ${reliability}`);
  console.log("✅ E2E ingestion complete");
}

main().catch(err => {
  console.error("❌ E2E ingestion failed:", err);
  process.exit(1);
});
