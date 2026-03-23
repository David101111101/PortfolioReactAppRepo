import fs from "fs"

function count(regex, file) {
  if (!fs.existsSync(file)) return 0
  const txt = fs.readFileSync(file, "utf8")
  return (txt.match(regex) || []).length
}

// crude but stable log parsing patterns
const eslintErrors = count(/error/gi, "summaries/eslint.txt")
const eslintWarnings = count(/warning/gi, "summaries/eslint.txt")

const typeErrors = count(/error TS/gi, "summaries/typecheck.txt")
const styleErrors = count(/error/gi, "summaries/stylelint.txt")
const htmlErrors = count(/Error:/gi, "summaries/htmlhint.txt")
const totalErrors = eslintErrors + typeErrors + styleErrors + htmlErrors
const maxAllowedErrors = Number(process.env.MAX_ALLOWED_LINT_ERRORS || 0)
const thresholdPassed = totalErrors <= maxAllowedErrors

let score = 100
score -= eslintErrors * 5
score -= eslintWarnings * 1
score -= typeErrors * 4
score -= styleErrors * 2
score -= htmlErrors * 2

score = Math.max(0, score)

// ---------- markdown ----------
let md = `## 🧹 Static Quality Gate\n\n`
md += `**Lint Score:** ${score}/100\n\n`
md += `**Total Errors:** ${totalErrors}\n\n`
md += `**Allowed Error Threshold:** ${maxAllowedErrors}\n\n`
md += `**Gate Status:** ${thresholdPassed ? "PASS" : "FAIL"}\n\n`
md += `| Signal | Count |\n`
md += `|--------|------|\n`
md += `| ESLint Errors | ${eslintErrors} |\n`
md += `| ESLint Warnings | ${eslintWarnings} |\n`
md += `| Type Errors | ${typeErrors} |\n`
md += `| Style Errors | ${styleErrors} |\n`
md += `| HTML Errors | ${htmlErrors} |\n`

fs.writeFileSync("summaries/lint.md", md)

// ---------- metrics for observability ----------
fs.mkdirSync("metrics", { recursive: true })

fs.writeFileSync(
  "metrics/lint.json",
  JSON.stringify({
    lintScore: score,
    totalErrors,
    maxAllowedErrors,
    thresholdPassed,
    eslintErrors,
    eslintWarnings,
    typeErrors,
    styleErrors,
    htmlErrors,
    ts: Date.now()
  })
)

console.log("Lint score:", score)