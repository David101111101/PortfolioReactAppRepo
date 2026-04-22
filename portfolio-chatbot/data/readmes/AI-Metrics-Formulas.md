# AI Metrics — Formulas & Computation Logic

This document defines how each metric in the AI Observability Dashboard is computed.

It is designed to answer:

- How is each metric calculated?
- What inputs influence it?
- How should it be interpreted?

---

# 1. P95 Latency

## Definition

P95 latency is the 95th percentile of response times collected during performance tests.

## Formula

P95 = sorted(latency_samples)[ceil(0.95 * N)]

Where:
- N = number of latency samples

---

## Baseline

Derived from historical runs:

baseline_latency ≈ 5400 ms

---

## Deviation

delta = actual_latency - baseline_latency  
delta_pct = delta / baseline_latency

---

## Interpretation

- delta_pct ≤ 0 → healthy
- 0–8% → slight degradation
- 8–15% → degraded
- >15% → severe

---

# 2. Retrieval Confidence

## Definition

Average confidence score across all retrieval results in a run.

## Formula

avg_confidence = sum(confidence_scores) / N

Where:
- confidence_scores come from retrieval evaluation
- N = number of retrieval samples

min_confidence = lowest individual confidence score in the run

---

## Baseline

baseline_confidence ≈ 81

---

## Deviation

delta = actual_confidence - baseline_confidence  
delta_pct = delta / baseline_confidence

---

## Interpretation

- within ±3% → stable
- -3% to -8% → slight degradation
- -8% to -15% → degraded
- < -15% → severe regression

---

## Min Confidence — Why It Matters

avg_confidence can hide localized regressions. A single language collapsing to 30 confidence while others hold at 85 still produces a healthy-looking average.

min_confidence is tracked separately and shown in:
- System Health metric card (subtitle)
- Regression Impact table (4th row: Min Confidence delta in absolute points)
- Multilingual Retrieval Quality table (per-language)
- System Risk Assessment (worst-case confidence row)

---

# 3. Reliability Score

## Definition

Composite system health score combining multiple signals.

## Formula

reliability_score = (
  latency_score * 0.35 +
  confidence_score * 0.30 +
  rate_limit_score * 0.20 +
  degradation_score * 0.15
) * 100

---

## Components

### Latency Score

latency_score = min(1, baseline_latency / p95_latency)

---

### Confidence Score

confidence_score = avg_confidence / 100

---

### Rate Limit Score

rate_limit_score = 1 - abs(enforcement_rate - expected_rate)

expected_rate ≈ 0.3077

---

### Degradation Score

degradation_score = 1 - degradation_ratio

---

## Interpretation

- stable → system behaving normally
- decreasing → early degradation
- sustained drop → system-level issue

## Important: Reliability Delta Is In Points, Not Percent

The Regression Impact section shows `reliability_delta` as absolute point change (e.g. +3 pts, -2 pts).

This is NOT a percentage. A delta of 3 means the score moved from 88 to 91 — a 3-point improvement.

---

# 4. Release Confidence

## Definition

Composite score that summarizes how many penalty thresholds were crossed in a run. Used as a summary signal — not shown as a standalone section on the dashboard.

---

## Formula

release_confidence = 100
  - latency_penalty
  - confidence_penalty
  - rate_limit_penalty
  - degradation_penalty

---

## Penalties

### Latency

- >5800 ms → -15
- >5400 ms → -8

---

### Confidence

- <78 → -15
- <81 → -8

---

### Rate Limit

- deviation >0.05 → -10

---

### Degradation

- >0.20 → -10
- >0.15 → -5

---

## Interpretation

- ≥95 → all signals healthy
- 85–95 → one or more metrics slightly degraded
- <85 → investigate — multiple thresholds crossed

---

# 4b. Production SLA Compliance Thresholds

## Definition

The Production SLA Compliance section applies five explicit thresholds to the current run and reports each gate as IN SLA / WATCH / BREACH. Unlike Release Confidence (a continuous score), SLA Compliance is a discrete status per gate.

---

## Gates and Thresholds

| Gate | IN SLA | WATCH | BREACH |
|------|--------|-------|--------|
| P95 Latency | ≤ 5,400 ms | ≤ 5,800 ms | > 5,800 ms |
| Rate Enforcement | deviation ≤ 5% | — | deviation > 5% |
| Avg Confidence | ≥ 72 | ≥ 65 | < 65 |
| Min Confidence (worst language) | ≥ 60 | ≥ 50 | < 50 |
| Concurrent Degradation | ≤ 1.00× | ≤ 1.20× | > 1.20× |

---

## SLA Verdict

The overall verdict is the worst status across all five gates:

- Any BREACH → SLA BREACH
- Any WATCH (no BREACH) → SLA WATCH
- All IN SLA → IN SLA

---

## Why Min Confidence is the AI-specific gate

avg_confidence can stay stable while a single language's retrieval collapses. A run with Portuguese at 0.35 and English at 0.85 produces an average near 0.70 — within normal range. The Min Confidence SLA surfaces this as a BREACH at the system level before it compounds.

---

## Data source

All five values come from `regression_run_summary`. No additional fetch beyond what the rest of the dashboard already loads.

---

# 5. Rate Limit Enforcement

## Definition

Measures correctness of rate limiting behavior.

---

## Expected Behavior

expected_blocked = total_requests - (limit - warmup)

Where:
- limit = 10
- warmup = 1
- total_requests = 13

---

## Expected Rate

expected_rate = 4 / 13 ≈ 0.3077

---

## Deviation

delta = actual_rate - expected_rate

---

## Interpretation

- |delta| ≤ 0.02 → correct
- 0.02–0.05 → slight drift
- >0.05 → incorrect enforcement

---

# 6. Flakiness

## Definition

Percentage of tests that produce inconsistent results (pass/fail non-deterministically) across runs.

---

## Formula

flakiness_pct = flaky_tests / total_tests * 100

This is computed at multiple levels:

- **Per-run**: `flakiness_run_summary` view → uses the `flaky` and `total_tests` columns from a specific test_runs row
- **Per-workflow trend**: `e2e_workflow_stability` view → separate rows for pr_e2e and deploy_e2e workflows
- **Per-test**: `test_flakiness_enriched` view → individual test flakiness across all runs

---

## Effective Flakiness — How Current State Is Computed

The dashboard resolves flakiness with a priority fallback:

1. Per-run summary for the selected weekly regression run (if > 0%)
2. Latest value from flakiness trend (if > 0%)
3. Max avg_flakiness_pct across E2E workflows (pr_e2e / deploy_e2e)

This ensures that when E2E workflows show degrading flakiness, the Current State signal reflects it — even when the weekly regression run itself has 0 flaky tests.

---

## Workflow Flakiness vs Aggregate Flakiness

The weekly regression suite and E2E pipelines are separate `workflow_type` values in `test_runs`. Their flakiness is tracked independently.

- `e2e_workflow_stability` shows pr_e2e and deploy_e2e workflows — these reflect browser-level instability
- `flakiness_trend` shows aggregate flakiness across runs
- Both are shown in the Test Suites Reliability section

---

## Interpretation

- <1% → reliable
- 1–3% → moderate instability
- >3% → unreliable test suite — signals may not be trustworthy

---

# 7. Language Drift (Per-Language Delta)

## Definition

Per-language confidence change between runs. This delta is surfaced in the **Δ column of the Multilingual Retrieval Quality section** on the dashboard.

## Formula

language_delta = current_run_avg_confidence[language] - prev_run_avg_confidence[language]

Each language is computed independently.

---

## Data Source

`retrieval_language_trend` Supabase view:

- Groups retrieval_metrics by run_id and language
- Uses a window function to compute the previous run's avg_confidence per language
- Produces a true per-language delta

---

## Why Not Global Delta

The previous version compared each language's confidence against the **global** previous run average. This caused every language to show the same delta — which was meaningless.

The correct approach fetches `retrieval_language_trend` and uses its `delta` field per language code.

---

## Classification

- delta > +3 → Improvement
- delta -3 to +3 → Stable
- delta -10 to -3 → Drop
- delta < -10 → Regression

---

## Dashboard Location

The per-language delta appears in the **Δ vs previous run** column of the Multilingual Retrieval Quality section. All four signals (avg, min, delta, risk) are shown in a single table — no separate section needed.

---

# 8. System Risk Assessment Signals

## Regression Severity

Computed in `regression_story` DB view:

severity = "critical" if |latency_pct| + |confidence_pct| > 1.0  
severity = "moderate" if > 0.5  
severity = "minor" if > 0.2  
severity = "stable" otherwise

---

## User Impact

- critical_user_impact → min_confidence < 25
- moderate_user_impact → min_confidence < 40
- performance_user_impact → latency_pct > 0.3
- no_user_impact → otherwise

---

## Primary Signal

- system_degradation → latency_pct > 0.2 AND confidence_pct < -0.2
- retrieval_regression → min_confidence < 40
- latency_regression → latency_pct > 0.3
- no_signal → otherwise

---

## Analysis Confidence

Based on number of historical runs in the comparison set:

- low → fewer than 3 runs
- medium → 3–5 runs
- high → 6+ runs

---

# Key Principle

All metrics follow:

→ baseline vs actual  
→ deviation  
→ interpretation  

This enables consistent reasoning across the system.

Metrics should never be read in isolation — the System Risk Assessment and AI Debug buttons are designed to surface cross-metric correlations automatically.
