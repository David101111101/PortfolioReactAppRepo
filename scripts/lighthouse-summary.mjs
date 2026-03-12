import fs from "fs";

const files = fs.readdirSync(".lighthouseci")
  .filter(f => f.startsWith("lhr-") && f.endsWith(".json"))
  .sort()
  .reverse();

const file = files[0];

if (!file) {
  console.log("### 🚦 Lighthouse\nReport not found");
  process.exit(0);
}

const lhr = JSON.parse(
  fs.readFileSync(`.lighthouseci/${file}`, "utf8")
);

const c = lhr.categories ?? {};

function pct(v) {
  return Math.round((v ?? 0) * 100);
}

const perf = pct(c.performance?.score);
const a11y = pct(c.accessibility?.score);
const bp = pct(c["best-practices"]?.score);
const seo = pct(c.seo?.score);

/**
 * Weighted engineering score
 * performance matters more
 */
const score =
  perf * 0.4 +
  a11y * 0.3 +
  bp * 0.2 +
  seo * 0.1;

fs.mkdirSync("metrics", { recursive: true });
fs.writeFileSync(
  "metrics/lighthouse.json",
  JSON.stringify({ score: Math.round(score) })
);

console.log("### 🚦 PR Lighthouse Score\n");

console.log(`**Overall Score:** ${Math.round(score)} / 100\n`);

console.log("| Category | Score |");
console.log("|---------|------|");
console.log(`| Performance | ${Math.round(perf)} |`);
console.log(`| Accessibility | ${Math.round(a11y)} |`);
console.log(`| Best Practices | ${Math.round(bp)} |`);
console.log(`| SEO | ${Math.round(seo)} |`);