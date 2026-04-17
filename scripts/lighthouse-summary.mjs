import fs from "fs";

const files = fs.readdirSync(".lighthouseci")
  .filter(f => f.startsWith("lhr-") && f.endsWith(".json"))
  .sort();

if (!files.length) {
  console.log("### 🚦 Lighthouse\nReport not found");
  process.exit(0);
}

function pct(v) {
  return Math.round((v ?? 0) * 100);
}

function weightedScore(c) {
  return (
    pct(c.performance?.score) * 0.4 +
    pct(c.accessibility?.score) * 0.3 +
    pct(c["best-practices"]?.score) * 0.2 +
    pct(c.seo?.score) * 0.1
  );
}

function pageLabel(url) {
  try {
    const u = new URL(url);
    const hash = (u.hash || "").trim();
    if (!hash || hash === "#" || hash === "#/") return "Home";
    if (hash.startsWith("#/dashboard")) return "Dashboard";
    const generic = hash.replace(/^#\/?/, "");
    return generic || "Home";
  } catch {
    return url;
  }
}

const reports = files.map(f => {
  const lhr = JSON.parse(fs.readFileSync(`.lighthouseci/${f}`, "utf8"));
  const c = lhr.categories ?? {};
  return {
    url: lhr.requestedUrl ?? lhr.finalUrl ?? f,
    perf: pct(c.performance?.score),
    a11y: pct(c.accessibility?.score),
    bp: pct(c["best-practices"]?.score),
    seo: pct(c.seo?.score),
    score: Math.round(weightedScore(c)),
  };
});

// Thresholds (must match lighthouserc-ci.json assertions)
const THRESHOLDS = { perf: 70, a11y: 90, bp: 85, seo: 85 };

function gate(val, min) {
  return val >= min ? "✅" : "❌";
}

console.log("### 🚦 Lighthouse Report\n");

for (const r of reports) {
  console.log(`#### ${pageLabel(r.url)}\n`);
  console.log(`**Overall Score:** ${r.score} / 100\n`);
  console.log("| Category | Score | Gate |");
  console.log("|----------|-------|------|");
  console.log(`| Performance    | ${r.perf}  | ${gate(r.perf, THRESHOLDS.perf)} ≥ ${THRESHOLDS.perf} |`);
  console.log(`| Accessibility  | ${r.a11y}  | ${gate(r.a11y, THRESHOLDS.a11y)} ≥ ${THRESHOLDS.a11y} |`);
  console.log(`| Best Practices | ${r.bp}    | ${gate(r.bp, THRESHOLDS.bp)} ≥ ${THRESHOLDS.bp} |`);
  console.log(`| SEO            | ${r.seo}   | ${gate(r.seo, THRESHOLDS.seo)} ≥ ${THRESHOLDS.seo} |`);
  console.log("");
}

// Combined score = average weighted score across all pages
const combinedScore = Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length);

fs.mkdirSync("metrics", { recursive: true });
fs.writeFileSync(
  "metrics/lighthouse.json",
  JSON.stringify({ score: combinedScore, pages: reports.map(r => ({ url: r.url, score: r.score })) })
);
