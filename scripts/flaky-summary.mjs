import fs from "fs";

let flaky = 0;
let failed = 0;
let passed = 0;

try {
  const jsonPath = "playwright-report/report.json";
  if (fs.existsSync(jsonPath)) {
    // Playwright JSON report has reliable flaky counts.
    // JUnit XML does not emit status="flaky" attributes.
    const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const stats = report.stats ?? {};
    flaky  = stats.flaky      ?? 0;
    failed = stats.unexpected ?? 0;
    passed = (stats.expected  ?? 0) + flaky;
  } else {
    // Fallback to XML — cannot detect flaky, only pass/fail counts
    const xml = fs.readFileSync("playwright-report/junit.xml", "utf8");
    const testcases = xml.split("<testcase");
    for (const tc of testcases) {
      if (tc.includes("<failure")) failed++;
      else if (tc.includes("</testcase>")) passed++;
    }
  }
} catch {
  console.log("⚠️ Flaky summary unavailable");
}

console.log("### 🧪 Test Stability\n");
console.log(`- Passed: ${passed}`);
console.log(`- Flaky: ${flaky}`);
console.log(`- Failed: ${failed}\n`);

fs.mkdirSync("metrics", { recursive: true });
fs.writeFileSync("metrics/flaky.json", JSON.stringify({ flaky, failed, passed }));