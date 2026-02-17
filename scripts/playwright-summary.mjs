/**
 * Playwright Test Summary Generator
 *
 * Parses Playwright JSON report and generates a markdown summary
 * for use in GitHub Actions workflows (PR comments or step summaries).
 *
 * Usage:
 *   node playwright-summary.mjs [browser] [outputPath]
 *
 * Arguments:
 *   browser    - Browser name (e.g., "chromium", "firefox") for display (default: "all")
 *   outputPath - Optional: write summary to file (e.g., summaries/chromium.md)
 *                If provided, also appends to GITHUB_STEP_SUMMARY env var
 *
 * Example:
 *   node scripts/playwright-summary.mjs chromium summaries/chromium.md
 */

import fs from "node:fs";
import path from "node:path";

// Parse command-line arguments
const browser = process.argv[2] ?? "all";
const outMd = process.argv[3]; // e.g. summaries/chromium.md

// Path to Playwright's JSON report (generated after test run)
const reportPath = "playwright-report/report.json";

// GitHub Actions environment variable for workflow step summary
const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;

// Exit early if report doesn't exist (no tests were run)
if (!fs.existsSync(reportPath)) process.exit(0);

// Parse the Playwright JSON report
const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));

/**
 * Recursively walk the suite tree to flatten all test specs
 *
 * Playwright organizes tests in a nested suite structure.
 * This function traverses suites and collects all specs into a flat array.
 *
 * @param {Array} suites - Array of suite objects (may contain nested suites)
 * @param {Array} out - Accumulator array for flattened specs
 * @returns {Array} Flat array of all test specs
 */
function walkSuites(suites, out = []) {
  for (const s of suites || []) {
    // Recursively walk nested suites first
    walkSuites(s.suites, out);
    // Collect all specs from current suite
    for (const spec of s.specs || []) out.push(spec);
  }
  return out;
}

// Flatten all test specs from the nested suite structure
const specs = walkSuites(report.suites);
const tests = [];

/**
 * Extract test results and detect flaky tests
 *
 * For each test spec, iterate through all attempts (retries) to:
 * - Determine final status
 * - Detect flakiness (test failed on first attempt but passed on retry)
 */
for (const spec of specs) {
  for (const t of spec.tests || []) {
    const results = t.results || [];
    const last = results[results.length - 1]; // Get final attempt
    const status = last?.status || "unknown";

    // Flaky = test was retried AND final result is passed BUT at least one attempt failed
    const flaky = results.length > 1 && status === "passed" && results.some((r) => r.status === "failed");

    tests.push({
      title: `${spec.title} › ${t.title}`,
      status,
      flaky,
    });
  }
}

// Calculate test statistics
const total = tests.length;
const passed = tests.filter((t) => t.status === "passed").length;
const failed = tests.filter((t) => t.status === "failed").length;
const flaky = tests.filter((t) => t.flaky).length;

// Get top 5 failed tests for quick visibility
const topFailures = tests.filter((t) => t.status === "failed").slice(0, 5);

/**
 * Format results as markdown for GitHub
 * Includes:
 * - Browser name and test counts
 * - Pass/fail/flaky statistics
 * - List of failing tests (if any)
 */
const md = [
  `### 🎭 Playwright (${browser})`,
  `- Total: **${total}** | Passed: **${passed}** | Failed: **${failed}** | Flaky: **${flaky}**`,
  failed ? `- Top failures:\n${topFailures.map((t) => `  - ${t.title}`).join("\n")}` : `- ✅ No failures`,
  ``,
].join("\n");

// Append to GitHub Step Summary (visible in workflow run UI)
if (stepSummaryPath) fs.appendFileSync(stepSummaryPath, md);

// Optionally write to output file (for use in PR comments, artifacts, etc.)
if (outMd) {
  fs.mkdirSync(path.dirname(outMd), { recursive: true });
  fs.writeFileSync(outMd, md);
}
