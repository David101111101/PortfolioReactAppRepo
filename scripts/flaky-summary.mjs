import fs from "fs";

let flaky = 0;
let failed = 0;
let passed = 0;

try {
  const xml = fs.readFileSync("playwright-report/junit.xml", "utf8");

  const testcases = xml.split("<testcase");

  for (const tc of testcases) {
    if (tc.includes('status="flaky"')) flaky++;
    else if (tc.includes("<failure")) failed++;
    else if (tc.includes("</testcase>")) passed++;
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