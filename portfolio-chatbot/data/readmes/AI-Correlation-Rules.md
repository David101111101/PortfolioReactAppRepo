# AI Correlation Rules — Cross-Metric Reasoning Engine

This document defines how different metrics relate to each other and how to infer root causes from combined signals.

It enables the system to answer:

- Why did the system degrade?
- Which metric caused the issue?
- What is the likely root cause?
- What should be investigated next?

---

# Core Principle

Metrics should never be analyzed in isolation.

Every regression must be evaluated as:

→ a combination of signals  
→ relative to baseline  
→ over time  

The dashboard surfaces these correlations automatically. The AI Debug buttons inject the actual metric snapshot so the chatbot can reason across signals without the user needing to manually gather data.

---

# 1. Latency + Confidence Correlation

## Pattern

Latency ↑ AND Confidence ↓

---

## Interpretation

Performance degradation is impacting retrieval quality.

---

## Likely Causes

- backend slowdown affecting retrieval timing
- timeouts reducing context quality
- incomplete or truncated responses

---

## Action

- inspect backend latency
- check API response times
- validate response completeness

---

# 2. Confidence Drop Only

## Pattern

Confidence ↓  
Latency stable

---

## Interpretation

Retrieval quality degradation independent of performance.

---

## Likely Causes

- embedding drift
- vector DB inconsistency
- ranking issues
- prompt/context mismatch

---

## Action

- inspect retrieved documents
- check overlap_ratio and rank_shift
- validate embedding model changes

---

# 3. Latency Increase Only

## Pattern

Latency ↑  
Confidence stable

---

## Interpretation

Performance issue without quality degradation.

---

## Likely Causes

- infrastructure slowdown
- increased load
- network issues

---

## Action

- inspect concurrent_p95
- check infrastructure metrics
- review recent deployments

---

# 4. Reliability Decrease

## Pattern

Reliability ↓

---

## Interpretation

Composite degradation across one or more signals.

---

## Diagnosis Strategy

1. Compare latency vs baseline  
2. Compare confidence vs baseline  
3. Check rate limit behavior  
4. Evaluate degradation_ratio  

---

## Action

Identify the dominant degrading metric. Reliability is a weighted composite — check which component is pulling it down.

Note: reliability_delta in the Regression Impact section is in **absolute points** (e.g. -3 pts), not a percentage.

---

# 5. Release Confidence Drop

## Pattern

Release confidence ↓

---

## Interpretation

System is crossing defined risk thresholds.

---

## Likely Causes

- latency above threshold (>5400 ms → -8 pts, >5800 ms → -15 pts)
- confidence below threshold (<81 → -8 pts, <78 → -15 pts)
- combined penalties

---

## Action

- identify which penalty triggered
- evaluate severity
- decide: release / hold / investigate

---

# 6. Rate Limit Deviation

## Pattern

Enforcement rate deviates from expected (~30.8%)

---

## Interpretation

Incorrect rate limiting behavior.

---

## Cases

### Over-enforcement

Actual > expected

→ users blocked too early

---

### Under-enforcement

Actual < expected

→ abuse protection weakened

---

## Action

- inspect request sequence
- validate limit configuration
- check warmup behavior

---

# 7. Flakiness + Other Metrics

## Pattern

Flakiness ↑ AND metric changes

---

## Interpretation

Signals may be unreliable. Do not act on other regressions until flakiness is resolved — flaky tests can fabricate or suppress real signals.

---

## Likely Causes

- unstable tests
- timing issues
- environment inconsistencies

---

## Important: Flakiness Source Matters

The dashboard tracks flakiness at three levels:

- **Weekly regression run** — the selected run's own flaky/total_tests ratio
- **E2E Workflow Breakdown** — separate pr_e2e and deploy_e2e workflow flakiness (may be degrading even when weekly run shows 0%)
- **Per-test flakiness** — individual tests ranked by instability rate

When E2E workflows show "degrading" trend, the Current State now reflects the max across all sources — not just the weekly run.

---

## Action

- identify flaky tests in the Flaky Tests Breakdown section
- check which workflow (pr_e2e or deploy_e2e) is most unstable
- stabilize before trusting regression signals

---

# 8. Confidence + Language Distribution

## Pattern

Confidence ↓ AND variation across languages ↑

---

## Interpretation

Localized degradation affecting specific user groups.

---

## Likely Causes

- language-specific retrieval gaps
- uneven dataset coverage
- embedding bias

---

## How to Detect

The Multilingual Retrieval Quality section shows per-language avg/min confidence plus the **Δ vs prev run** column sourced from `retrieval_language_trend`.

The Language Drift section shows each language's true per-language confidence change — not a global approximation. All languages showing different deltas is expected and correct.

---

## Action

- identify worst-performing language
- inspect multilingual retrieval data
- validate language coverage

---

# 9. Degradation Ratio + Latency

## Pattern

Degradation_ratio ↑ AND latency ↑

---

## Interpretation

System does not scale under concurrency.

---

## Likely Causes

- inefficient concurrency handling
- resource contention
- backend bottlenecks

---

## Action

- analyze concurrent_p95
- test under load
- optimize parallel processing

---

# 10. Flat Reliability + Changing Metrics

## Pattern

Reliability stable  
Other metrics changing

---

## Interpretation

Reliability scoring is too insensitive to capture the change.

---

## Action

- review weighting logic
- validate normalization
- adjust scoring model

---

# 11. Sustained Trend Detection

## Pattern

Metric consistently increasing or decreasing across runs

---

## Interpretation

System-level drift (not noise)

---

## Action

- prioritize investigation
- correlate with deployments
- evaluate long-term impact

---

# 12. Min Confidence vs Avg Confidence Divergence

## Pattern

avg_confidence healthy  
min_confidence critically low (or min_confidence_delta strongly negative)

---

## Interpretation

A specific language or query type is collapsing while the aggregate looks fine. This is a hidden localized regression.

---

## Where to Look

- Regression Impact section: min_confidence_delta row (absolute point change)
- Multilingual Retrieval Quality: per-language min column and status dot
- System Risk Assessment: worst-case confidence row showing which language is lowest

---

## Action

- identify which language has the lowest min_confidence
- inspect Language Drift section for that language's trend
- check retrieval data for that language in the vector store

---

# 13. E2E Workflow Degrading + Weekly Run Healthy

## Pattern

pr_e2e or deploy_e2e shows "degrading" trend in Workflow Breakdown  
Weekly regression run flakiness = 0%

---

## Interpretation

These are separate test_runs entries tracked independently. The weekly regression suite may not execute the same tests as E2E browser pipelines.

This is not a contradiction — it means browser-level instability exists in CI but is not captured by the weekly AI regression suite.

---

## Action

- check which workflow is degrading (PR validation vs deploy verification)
- look at top flaky tests in the Flaky Tests Breakdown — filter by recency "recent"
- investigate timing, browser-specific behavior, or environment differences

---

# Correlation Priority Rules

When multiple signals change:

1. Confidence drop takes priority (user impact)
2. Latency increase is secondary (performance)
3. Reliability summarizes combined effects
4. Flakiness can invalidate all signals
5. Min confidence can reveal hidden language regressions masked by the average

---

# Root Cause Heuristics

## High Confidence Regression

Confidence ↓ significantly

→ retrieval system issue

---

## Performance Regression

Latency ↑ significantly

→ infrastructure/backend issue

---

## System Degradation

Reliability ↓ + multiple signals

→ systemic issue

---

## False Positive Risk

Flakiness ↑

→ validate tests before acting

---

## Hidden Language Regression

min_confidence << avg_confidence

→ inspect per-language metrics in Multilingual Quality and Language Drift

---

# Decision Framework

When a regression is detected:

1. Identify which metric deviated from baseline
2. Check if deviation is sustained across runs
3. Correlate with other metrics
4. Check flakiness — if high, treat signals with caution
5. Determine dominant signal
6. Map to likely root cause
7. Use the AI Debug button on the relevant section — it sends the real metric snapshot so the chatbot can reason from actual data

---

# Goal

Transform monitoring into reasoning:

→ from "what happened"  
→ to "why it happened"  
→ to "what to do next"  

This enables intelligent debugging and decision-making.
