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

Identify the dominant degrading metric.

---

# 5. Release Confidence Drop

## Pattern

Release confidence ↓

---

## Interpretation

System is crossing defined risk thresholds.

---

## Likely Causes

- latency above threshold
- confidence below threshold
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

Signals may be unreliable.

---

## Likely Causes

- unstable tests
- timing issues
- environment inconsistencies

---

## Action

- identify flaky tests
- stabilize before trusting regression

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

Reliability scoring is too insensitive.

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

# Correlation Priority Rules

When multiple signals change:

1. Confidence drop takes priority (user impact)
2. Latency increase is secondary (performance)
3. Reliability summarizes combined effects
4. Flakiness can invalidate all signals

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

# Decision Framework

When a regression is detected:

1. Identify which metric deviated from baseline
2. Check if deviation is sustained across runs
3. Correlate with other metrics
4. Determine dominant signal
5. Map to likely root cause
6. Suggest action

---

# Goal

Transform monitoring into reasoning:

→ from “what happened”  
→ to “why it happened”  
→ to “what to do next”  

This enables intelligent debugging and decision-making.