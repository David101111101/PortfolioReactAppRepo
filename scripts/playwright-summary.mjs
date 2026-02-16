import fs from "node:fs";
import path from "node:path";

const browser = process.argv[2] ?? "all";
const outMd = process.argv[3]; // e.g. summaries/chromium.md
const reportPath = "playwright-report/report.json";
const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!fs.existsSync(reportPath)) process.exit(0);

const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));

function walkSuites(suites, out = []) {
  for (const s of suites || []) {
    walkSuites(s.suites, out);
    for (const spec of s.specs || []) out.push(spec);
  }
  return out;
}

const specs = walkSuites(report.suites);
const tests = [];

for (const spec of specs) {
  for (const t of spec.tests || []) {
    const results = t.results || [];
    const last = results[results.length - 1];
    const status = last?.status || "unknown";
    const flaky = results.length > 1 && status === "passed" && results.some((r) => r.status === "failed");

    tests.push({
      title: `${spec.title} › ${t.title}`,
      status,
      flaky,
    });
  }
}

const total = tests.length;
const passed = tests.filter((t) => t.status === "passed").length;
const failed = tests.filter((t) => t.status === "failed").length;
const flaky = tests.filter((t) => t.flaky).length;

const topFailures = tests.filter((t) => t.status === "failed").slice(0, 5);

const md = [
  `### 🎭 Playwright (${browser})`,
  `- Total: **${total}** | Passed: **${passed}** | Failed: **${failed}** | Flaky: **${flaky}**`,
  failed ? `- Top failures:\n${topFailures.map((t) => `  - ${t.title}`).join("\n")}` : `- ✅ No failures`,
  ``,
].join("\n");

if (stepSummaryPath) fs.appendFileSync(stepSummaryPath, md);

if (outMd) {
  fs.mkdirSync(path.dirname(outMd), { recursive: true });
  fs.writeFileSync(outMd, md);
}
