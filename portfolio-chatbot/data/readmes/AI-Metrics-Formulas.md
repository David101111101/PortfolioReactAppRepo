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

---

# 4. Release Confidence

## Definition

Decision-oriented score indicating whether the system is safe to release.

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

- ≥95 → safe to release
- 85–95 → caution
- <85 → investigate before release

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

Percentage of tests that pass/fail inconsistently.

---

## Formula

flakiness_pct = flaky_tests / total_tests

---

## Interpretation

- <1% → reliable
- 1–3% → moderate instability
- >3% → unreliable test suite

---

# Key Principle

All metrics follow:

→ baseline vs actual  
→ deviation  
→ interpretation  

This enables consistent reasoning across the system.