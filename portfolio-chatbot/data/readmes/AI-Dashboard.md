# AI Observability Dashboard — System Overview

The AI Observability Dashboard is a historical intelligence layer built on top of a Retrieval-Augmented Generation (RAG) system. It transforms raw QA metrics into actionable signals that answer:

> Is the system healthy, why not, and who is impacted?

Unlike traditional dashboards that display static metrics, this system uses **baseline vs drift analysis**, **multi-signal correlation**, and **historical trend evaluation** to surface meaningful insights.

Every section has a 💬 "Debug with AI" button that injects real metric data directly into the chatbot context — turning this dashboard into an interactive debugging session.

---

# Core Principles

## 1. Baseline vs Drift (Primary Design Pattern)

All major metrics are evaluated relative to historical baselines rather than static thresholds.

- Latency → compared against median historical P95 (~5400 ms)
- Confidence → compared against historical average (~81)
- Reliability → compared against system baseline (~91)

This allows detection of:
- gradual degradation
- early regressions
- performance drift

---

## 2. Multi-Signal Intelligence

The dashboard does not rely on a single metric.

It combines:

- Latency (performance)
- Retrieval Confidence (quality)
- Rate Limit Enforcement (correctness)
- Concurrency Degradation (stability)
- Flakiness (test reliability)
- Language Drift (multilingual quality)

These signals are aggregated into higher-level indicators such as **Reliability Score**, **Release Confidence**, and **System Risk Assessment**.

---

## 3. Trend-Aware Insights

Each metric includes:

- current value
- deviation from baseline
- comparison vs previous run
- trend direction

This enables answering:

- Is the system getting better or worse?
- Is this change significant?
- Should we act?

---

## 4. AI-Powered Debug Buttons

Every major section has a 💬 button that pre-fills the chatbot with the actual metric snapshot for that section. The chatbot receives real numbers — not just the question — so it can reason about root causes, correlations, and recommended actions without the user needing to copy data manually.

---

# Dashboard Sections

## 1. System Health Overview (Key Metrics)

Four metric cards at the top of the dashboard, each with an AI debug button:

- **P95 Latency** — response time under load vs baseline
- **Reliability Score** — composite health (latency 35%, confidence 30%, rate limit 20%, degradation 15%)
- **Retrieval Confidence** — average quality of retrieved context
- **Rate Limit Enforcement** — correctness of rate limiting vs expected ~30.8%

---

## 2. Regression Impact (vs Previous Run)

Side-by-side delta table comparing the current run to the previous run.

### Rows shown

- **Latency** — % change (lower-is-better; red if >+20%)
- **Avg Confidence** — % change (higher-is-better; red if <-10%)
- **Reliability** — absolute point change (e.g. +3 pts, -2 pts) — NOT a percentage
- **Min Confidence** — absolute point change (worst-case signal; surfaces edge-language regressions hidden by the average)

### Data source

`regression_run_comparison` Supabase view.

Fields used: `latency_pct`, `confidence_pct`, `reliability_delta`, `min_confidence_delta`.

### Why Min Confidence matters

`avg_confidence` can look stable while a specific language collapses. `min_confidence_delta` reveals that hidden worst-case regression.

### AI button

Sends % latency and confidence deltas. AI identifies likely root causes and what to investigate.

---

## 3. Performance Trends

Line chart showing latency, confidence, and reliability across the last 10 runs.

Sustained downward trends indicate systemic regression risk rather than noise.

---

## 4. Failure vs Latency Correlation

Dual-axis line chart comparing P95 latency (left axis) vs test failure rate % (right axis) over time.

Correlated spikes — both rising together — suggest infrastructure or backend issues are causing test failures, not flaky code.

Join strategy: regression runs and test runs are matched by closest timestamp since they use different key types (UUID vs numeric).

---

## 5. Multilingual Retrieval Quality

Per-language retrieval confidence table for the currently selected run.

### Columns

- Language name
- avg confidence | min confidence
- Δ vs previous run (from `retrieval_language_trend` DB view — true per-language historical delta)
- Risk classification (Healthy / Risk / Critical) + status dot

### Stability signals

- **Unstable flag**: if `avg_confidence - min_confidence > 15` for a language → the retrieval results are inconsistent within that language
- **Highest Risk**: the language with the lowest `min_confidence`
- **Retrieval Stability**: global `avg_rank_shift` — how much document ranking is changing between runs

### Data source

`retrieval_language_summary` (per-run) + `retrieval_language_trend` (delta column).

### AI button

Asks which languages are at risk and what may be causing low confidence for non-English queries.

---

## 6. Language Drift

Per-language confidence change vs the previous run — using actual per-language historical deltas from the `retrieval_language_trend` DB view.

### Why this is different from Multilingual Quality

- **Multilingual Quality** = current run absolute values (avg, min)
- **Language Drift** = change from prior run per language

Each language gets its own true delta. All languages showing the same value would indicate a data problem.

### Classification

- delta > +3 → Improvement (green)
- delta -3 to +3 → Stable (green)
- delta -10 to -3 → Drop (yellow)
- delta < -10 → Regression (red)

### AI button

Asks which languages are regressing and whether it's likely an embedding, chunking, or data coverage issue.

---

## 7. AI System Intelligence

Automated narrative generated from the `regression_story` DB view.

Shows:
- Trend direction (improving / degrading / stable)
- Regression severity (stable / minor / moderate / critical)
- Primary signal (what is the dominant cause)
- User impact classification
- Analysis confidence (low / medium / high — based on number of runs available)

### AI button

Sends severity and primary signal. AI explains likely root causes and recommended investigation order.

---

## 8. Last 5 Runs Trend

Clickable table of recent runs. Click a row to switch the selected run, then use 💬 on any section to ask the AI about that specific run.

---

## 9. Test Suites Reliability

Tracks test instability across all CI workflows.

### Current State

Shows the highest flakiness signal across all sources:
1. Weekly regression run's own flakiness (from `flakiness_run_summary`)
2. Latest flakiness trend value (from `flakiness_trend`)
3. Max avg_flakiness_pct across E2E workflows (from `e2e_workflow_stability`)

This ensures that if E2E pipelines show degrading flakiness, Current State reflects it — even when the weekly regression run itself reports 0%.

### Workflow Breakdown

Per-workflow table from `e2e_workflow_stability`:
- **PR E2E** — flakiness during pull request validation (pr_e2e)
- **Deploy E2E** — flakiness during deployment verification (deploy_e2e)

Each row shows: current %, previous %, delta, trend direction (improving / stable / degrading).

### Historical Trend chart

Line chart of overall flakiness % across runs.

### AI button

Injects the full snapshot as text: overall flakiness, workflow-by-workflow breakdown with current/prev/delta/trend, and top flaky test names with severity. The AI reasons about root causes from real numbers.

---

## 10. Flaky Tests Breakdown

Ranked table of individual flaky tests from `test_flakiness_enriched`:
- Test name
- Flakiness % (flaky runs / total runs)
- Flaky / Total ratio
- Severity (high / medium / low)
- Recency (recent = within 7 days / stale)

High-severity + recent = active problem to prioritize.

---

## 11. System Risk Assessment

Aggregated risk scorecard combining retrieval and test stability signals.

### Rows

- **Regression Severity** — from `regression_story.regression_severity` (stable / minor / moderate / critical)
- **User Impact** — human-readable classification from `regression_story.user_impact`
  - Critical — users severely affected
  - Moderate — degraded experience
  - Performance — latency noticeable
  - None detected
- **Primary Signal** — dominant root cause from `regression_story.primary_signal`
  - System-wide degradation (latency + confidence both moving)
  - Retrieval regression (min confidence critical)
  - Latency regression (response time spike)
  - No regression signal
- **Analysis Confidence** — low / medium / high (based on number of historical runs available for statistical comparison)
- **Worst-case Confidence** — the min_confidence of the worst-performing language
- **Retrieval Stability** — aggregate status: Stable / Retrieval instability detected / Test instability (flaky suite)

### AI button

Sends severity, primary signal, and user impact as text. AI explains what this means for end users and what to prioritize.

---

# Metric Baselines

All baselines are derived from historical production runs:

| Metric | Baseline | Degraded | Severe |
|---|---|---|---|
| P95 Latency | 5400 ms | >5400 ms | >5800 ms |
| Avg Confidence | 81 | <75 | <60 |
| Reliability Score | 91 | <88 | <85 |
| Rate Limit | 30.8% | ±5% deviation | ±10% deviation |
| Flakiness | <1% | 1–3% | >3% |

---

# System Value

This dashboard transforms QA from:

→ validation (pass/fail)

into:

→ **continuous system intelligence**

It enables:

- early detection of AI behavioral regressions
- per-language retrieval quality monitoring
- multi-workflow test stability tracking
- data-driven release decisions
- AI-powered root cause reasoning on real production data

---

# Key Takeaway

The AI Observability Dashboard is not just a visualization layer.

It is a **decision system** that continuously answers:

- Is the system behaving normally?
- What changed?
- Does it matter?
- Should we act?

The embedded RAG chatbot turns that question into a conversation — grounded in the actual metrics shown on screen.
