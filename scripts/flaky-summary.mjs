import fs from "fs";

let flaky = 0;
let failed = 0;
let passed = 0;

try {
  const data = JSON.parse(
    fs.readFileSync("playwright-report/test-results.json", "utf8")
  );

  for (const suite of data.suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        if (test.status === "flaky") flaky++;
        if (test.status === "failed") failed++;
        if (test.status === "passed") passed++;
      }
    }
  }
} catch {
  console.log("⚠️ Flaky summary unavailable");
  process.exit(0);
}

console.log("### 🧪 Test Stability Signal\n");
console.log(`- Passed: ${passed}`);
console.log(`- Flaky: ${flaky}`);
console.log(`- Failed: ${failed}\n`);

fs.mkdirSync("metrics", { recursive: true });
fs.writeFileSync(
  "metrics/flaky.json",
  JSON.stringify({ flaky, failed, passed })
);