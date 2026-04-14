
**This repo demonstrates production-grade practices:** integrated Playwright E2E tests, accessibility checks, performance audits, automated PR quality gates, visual reporting with JUnit, and an automated summary comment posted on each run.

https://www.daveautomation.dev/


## Quality assurance built-in

- **Automated E2E tests** — Smoke, navigation, accessibility checks on every PR
- **Cross-browser validation** — Tests run on Chromium, Firefox, WebKit in parallel
- **Accessibility audits** — axe-core integration ensures WCAG compliance with SEO, Accessibility and Best Practices thresholds
- **Performance budgets** — Lighthouse CI prevents regressions
- **Full-project lint enforcement** — ESLint, TypeScript, Stylelint, and HTMLHint enforced as CI gate; zero-error policy blocks merges
- **Instant debugging** — Traces, screenshots, videos retained on failure

---

## PR Quality Gates: Playwright E2E + GitHub Actions

This portfolio itself demonstrates production-grade automation practices. Every pull request is validated through an integrated Playwright E2E framework before merging to `main`.

### What's automated

| Feature | Benefit |
|---------|---------|
| **Fixtures + Page Object Model (POM)** | Maintainable, scalable test architecture that reduces friction as tests grow |
| **Cross-browser execution** | Parallel runs across Chromium, Firefox, and WebKit — catch rendering bugs across engines |
| **Accessibility checks** | axe-core integration validates WCAG compliance in every PR |
| **Performance budgets** | Lighthouse CI enforces performance thresholds — no regressions slip through |
| **Lint quality gate** | ESLint, TypeScript, Stylelint, HTMLHint enforced on every PR; zero-error policy |
| **Deterministic test-mode rendering contract** | Eliminates UI flake from modern visual effects in local and CI E2E without runtime style-injection races |
| **AI Dashboard navigation test** | Validates `/#/dashboard` routing and page load for the live observability dashboard |
| **Debug artifacts** | Traces, screenshots, and videos auto-retained on failure for instant root-cause analysis |
| **JUnit in Checks UI** | Test results appear in GitHub's native Checks panel — no downloads needed |
| **Automated PR comments** | github-actions[bot] posts a summary per run so reviewers get instant signal |

### Why it matters

- PR gates reduce regressions — main stays deployable
- Lint gate enforces merge quality — no PR is allowed when lint errors are detected
- Deterministic test rendering removes visual flake — stable snapshots and interaction timing across local + CI
- Debug artifacts make failures actionable — not just red/green
- Fast, readable CI feedback — developers iterate with confidence

---

## Deterministic test-mode rendering contract (local + CI)

To harden E2E reliability, Playwright runs this app under a deterministic rendering contract. This ensures test stability by disabling non-deterministic visual behaviors at the source, not via ad-hoc runtime CSS injection.

### Contract guarantees when Playwright runs

- **No animations**
- **No transitions**
- **No smooth scroll**
- **No backdrop blur**
- **No heavy shadows**
- **No gradient motion**
- **No transform motion**
- **Predictable layout behavior**

### Why this is robust

- **No runtime style-injection races** — test behavior does not depend on late-injected CSS overrides
- **Parity across environments** — the same deterministic rendering rules are applied in local and CI
- **Less flake, faster triage** — failures indicate real regressions instead of timing artifacts from visual effects

The contract is implemented via `src/themeOverlay.ts` and the `data-test-mode` HTML attribute set by `e2e/pages/HomePage.ts::enableTestMode()`.

---

## Lint quality gate (local + CI)

ESLint, TypeScript type-checking, Stylelint, and HTMLHint run as a mandatory CI gate via `.github/workflows/lint-quality-gate.yml`.

### What this guarantees

- **Full-project static analysis** on every change set (`.ts`, `.tsx`, `.js`, `.css`, `.html`)
- **Zero known lint debt** at the current baseline
- **Fail-fast PR protection** — any violation blocks the PR merge
- **Consistent code quality standards** across local development and CI

### CI workflow

Workflow: [.github/workflows/lint-quality-gate.yml](.github/workflows/lint-quality-gate.yml)

---

## AI Observability Dashboard Page

`src/pages/Dashboard.tsx` is a full React page accessible at `/#/dashboard`. It is part of the portfolio's `HashRouter` routing and is covered by E2E navigation tests.

### What the Dashboard renders

The Dashboard queries Supabase directly via REST API and renders live production metrics:

- **P95 Latency panel** — current latency vs historical baseline (5 400 ms), with deviation labels (Healthy / Degraded / Severe)
- **Retrieval Confidence panel** — avg and min confidence per language across English, Spanish, French, German, Portuguese, Chinese, and Japanese
- **Reliability Score panel** — weighted reliability metric with Recharts `LineChart`, `ReferenceArea` SLA bands, and trend line over historical runs
- **Rate-Limit Enforcement panel** — measured block rate vs expected 30.8%, drift classified into four bands
- **Flakiness panel** — current flakiness % and a 5-run sparkline from `flakiness_trend` view
- **Regression Story panel** — narrative: trend direction, regression severity, primary signal, user impact, analysis confidence
- **Test Run table** — per-workflow pass/fail with commit SHA, surfaced from `e2e_workflow_stability` view
- **Flaky Test detail** — per-test flakiness %, severity, recency, last seen timestamp

### Visualisation library

[Recharts](https://recharts.org/) is used for all chart components:
- `LineChart` with `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Legend`
- `ReferenceArea` for SLA band shading (green/yellow/orange/red zones)
- `ReferenceLine` for baseline markers
- `ResponsiveContainer` for responsive sizing
- `IntersectionObserver`-based `LazyViewport` wrapper for deferred render (performance)

### Supabase views consumed

| View | Panel |
|------|-------|
| `regression_run_comparison` | Latency, Reliability, Rate-Limit |
| `regression_story` | Regression Story |
| `retrieval_language_summary` | Confidence per language |
| `flakiness_run_summary` | Flakiness current value |
| `flakiness_trend` | Flakiness sparkline |
| `test_flakiness_enriched` | Flaky test detail table |
| `e2e_workflow_stability` | Test run table |

---

## Test Coverage

Tests validate:
- Smoke (page loads, critical paths work)
- Navigation (header, routing, external links)
- Accessibility (axe-core: WCAG compliance)
- Resume download functionality
- AI Dashboard navigation (`/#/dashboard` URL confirmed in `navigation.spec.ts`)
- Chatbot: mocked responses, greeting, send/receive, close

---

## Deployment

This repo uses a fully gated CI/CD pipeline targeting GitHub Pages.

### PR Quality Gates (Branch Protection)

Every PR to `main` is automatically validated:

1. **Lint Workflow** — ESLint, TypeScript, Stylelint, HTMLHint; PR blocked if any violation is detected
2. **Backend Tests** — Worker starts locally, Vitest suite runs
3. **E2E Tests** — Chromium-only smoke, navigation, accessibility, and chat checks
4. **Lighthouse Audits** — Performance budget enforcement (no regressions)
5. **Test Results** — JUnit reports visible in GitHub Checks UI
6. **PR Summary** — Automated comment with test results, quality score, and debugging path

Only PRs that pass all gates can be merged to main.

Workflow: [.github/workflows/pr-quality-gates.yml](.github/workflows/pr-quality-gates.yml)

### Release & Deployment

Once merged to `main`:

1. **Backend verification** — Worker boots, `test:ci` runs
2. **E2E browser matrix** — Playwright on Chromium, Firefox, WebKit in parallel
3. **Flaky budget enforcement** — Release blocked if flaky count > 3
4. **Lighthouse gate** — Performance, accessibility, best-practices, SEO thresholds checked
5. **Deploy** — `dist/` deployed to GitHub Pages only if all gates pass
6. **Lighthouse trend** — Delta vs previous baseline published in release summary

Workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

### Local validation before pushing

```bash
npm run build          # Catch build errors early
npm run test:e2e       # Run full test suite
npm run lint           # ESLint
npm run typecheck      # TypeScript
npm run csslint        # Stylelint
npm run htmllint       # HTMLHint
```

This mirrors what the CI pipeline will check — catch issues before opening a PR.


## Contact

- Email davidstevenabril@gmail.com
