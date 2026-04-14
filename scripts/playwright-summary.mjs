import fs from "node:fs";
import path from "node:path";

const browser = process.argv[2] ?? "all";
const outMd = process.argv[3];

const jsonPath = "playwright-report/report.json";
const xmlPath = "playwright-report/junit.xml";
const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;

let total = 0, failed = 0, flaky = 0, passed = 0;
let hasData = false;

// Playwright JSON report has reliable flaky counts via stats.flaky.
// The JUnit XML does not emit flaky="true" or status="flaky" attributes,
// so XML-only counting always reports flaky=0.
if (fs.existsSync(jsonPath)) {
  const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const stats = report.stats ?? {};
  flaky   = stats.flaky      ?? 0;
  failed  = stats.unexpected ?? 0;
  // expected = tests that passed on first attempt; flaky tests also ultimately passed
  passed  = (stats.expected ?? 0) + flaky;
  total   = passed + failed + (stats.skipped ?? 0);
  hasData = true;
} else if (fs.existsSync(xmlPath)) {
  // Fallback: XML can count totals and failures but not flaky tests
  const xml = fs.readFileSync(xmlPath, "utf8");
  total  = (xml.match(/<testcase/g) || []).length;
  failed = (xml.match(/<failure/g)  || []).length;
  passed = total - failed;
  hasData = true;
}

if (!hasData) {
  const md = `### 🎭 Playwright (${browser})\n⚠️ Report unavailable\n\n`;
  if (stepSummaryPath) fs.appendFileSync(stepSummaryPath, md);
  if (outMd) {
    fs.mkdirSync(path.dirname(outMd), { recursive: true });
    fs.writeFileSync(outMd, md);
  }
  process.exit(0);
}

const lines = [
  `### 🎭 Playwright (${browser})`,
  `- Total: **${total}** | Passed: **${passed}** | Failed: **${failed}** | Flaky: **${flaky}**`,
  failed ? `- ❌ Failures detected` : `- ✅ No failures`,
];
if (flaky) lines.push(`- ⚠️ ${flaky} flaky test(s) detected`);
lines.push(``);

const md = lines.join("\n");

if (stepSummaryPath) fs.appendFileSync(stepSummaryPath, md);

if (outMd) {
  fs.mkdirSync(path.dirname(outMd), { recursive: true });
  fs.writeFileSync(outMd, md);
}