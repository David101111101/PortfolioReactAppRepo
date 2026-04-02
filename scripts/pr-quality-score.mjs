import fs from "fs";

function read(name, def) {
  try {
    return JSON.parse(fs.readFileSync(`metrics/${name}`, "utf8"));
  } catch {
    return def;
  }
}

const e2e = read("e2e.json", { e2e: "fail" });
const a11y = read("a11y.json", { axeCritical: 999 });
const lh = read("lighthouse.json", { score: 0 });
const bundle = read("bundle.json", { bundleKB: 0 });
const dur = read("duration.json", { durationSec: 0 });

let score = 0;

if (e2e.e2e === "pass") score += 25;

if (a11y.axeCritical === 0) score += 15;

score += lh.score * 0.4;

/**
 * Simple bundle penalty model
 */
if (bundle.bundleKB > 250) score -= 5;
if (bundle.bundleKB > 300) score -= 10;

/**
 * CI scalability signal
 */
if (dur.durationSec < 300) score += 10;
else if (dur.durationSec < 420) score += 5;

score = Math.max(0, Math.min(100, Math.round(score)));

let verdict = "✅ Excellent";
if (score < 50) verdict = "❌ Poor";
else if (score < 70) verdict = "⚠️ Needs improvement";
else if (score < 85) verdict = "👍 Good";

const breakdown = `
- E2E: ${e2e.e2e === "pass" ? "✅" : "❌"}
- Accessibility: ${a11y.axeCritical === 0 ? "✅" : "⚠️ (" + a11y.axeCritical + ")"}
- Lighthouse: ${lh.score}
- Bundle: ${bundle.bundleKB} KB
- Duration: ${dur.durationSec}s
`;

const output = `
### 🎯 PR Quality Score: ${score} / 100
**Verdict:** ${verdict}

${breakdown}
`;

fs.writeFileSync("summaries/quality-score.md", output);
console.log(output);