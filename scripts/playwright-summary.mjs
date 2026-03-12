import fs from "node:fs";
import path from "node:path";

const browser = process.argv[2] ?? "all";
const outMd = process.argv[3];

const reportPath = "playwright-report/junit.xml";
const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!fs.existsSync(reportPath)) {
  const md = `### 🎭 Playwright (${browser})\n⚠️ Report unavailable\n\n`;
  if (stepSummaryPath) fs.appendFileSync(stepSummaryPath, md);
  if (outMd) {
    fs.mkdirSync(path.dirname(outMd), { recursive: true });
    fs.writeFileSync(outMd, md);
  }
  process.exit(0);
}

const xml = fs.readFileSync(reportPath, "utf8");

const total = (xml.match(/<testcase/g) || []).length;
const failed = (xml.match(/<failure/g) || []).length;
const flaky = (xml.match(/flaky="true"/g) || []).length;
const passed = total - failed;

const md = [
  `### 🎭 Playwright (${browser})`,
  `- Total: **${total}** | Passed: **${passed}** | Failed: **${failed}** | Flaky: **${flaky}**`,
  failed ? `- ❌ Failures detected` : `- ✅ No failures`,
  ``,
].join("\n");

if (stepSummaryPath) fs.appendFileSync(stepSummaryPath, md);

if (outMd) {
  fs.mkdirSync(path.dirname(outMd), { recursive: true });
  fs.writeFileSync(outMd, md);
}