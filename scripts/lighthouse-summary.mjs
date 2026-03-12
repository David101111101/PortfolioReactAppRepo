import fs from "fs";

const file = fs.readdirSync(".lighthouseci")
  .find(f => f.startsWith("lhr-") && f.endsWith(".json"));

if (!file) {
  console.log("### 🚦 Lighthouse\nReport not found");
  process.exit(0);
}

const lhr = JSON.parse(
  fs.readFileSync(`.lighthouseci/${file}`, "utf8")
);

fs.mkdirSync("metrics", { recursive: true });
fs.writeFileSync(
  "metrics/lighthouse.json",
  JSON.stringify({ score: Math.round(score) })
);

const c = lhr.categories;

const perf = c.performance.score * 100;
const a11y = c.accessibility.score * 100;
const bp = c["best-practices"].score * 100;
const seo = c.seo.score * 100;

/**
 * Weighted engineering score
 * performance matters more
 */
const score =
  perf * 0.4 +
  a11y * 0.3 +
  bp * 0.2 +
  seo * 0.1;

console.log("### 🚦 PR Lighthouse Score\n");

console.log(`**Overall Score:** ${Math.round(score)} / 100\n`);

console.log("| Category | Score |");
console.log("|---------|------|");
console.log(`| Performance | ${Math.round(perf)} |`);
console.log(`| Accessibility | ${Math.round(a11y)} |`);
console.log(`| Best Practices | ${Math.round(bp)} |`);
console.log(`| SEO | ${Math.round(seo)} |`);