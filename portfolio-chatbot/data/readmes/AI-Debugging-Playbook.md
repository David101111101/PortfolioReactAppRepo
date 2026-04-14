# AI Debugging Playbook — How to Investigate Issues

This guide explains how to debug issues detected in the AI Observability Dashboard.

It answers:

- What does this signal mean?
- What is the likely root cause?
- What should be checked next?

---

# 1. Latency Issues

## Symptom

- P95 latency above baseline
- Upward trend across runs

---

## Likely Causes

- backend API slowdown
- model response delay
- increased payload size
- network latency

---

## What to Check

1. Compare concurrent_p95 vs normal latency
2. Check recent deployments
3. Inspect API response times
4. Validate caching behavior

---

## Interpretation

- isolated spike → transient issue
- sustained increase → system degradation

---

# 2. Confidence Drops

## Symptom

- avg_confidence decreases
- multilingual variation increases

---

## Likely Causes

- retrieval quality degradation
- embedding drift
- vector DB inconsistency
- prompt changes

---

## What to Check

1. Compare overlap_ratio and rank_shift
2. Identify worst-performing language
3. Inspect retrieved context quality
4. Check embedding model changes

---

## Interpretation

- small drop → noise
- sustained drop → retrieval issue

---

# 3. Reliability Decrease

## Symptom

- reliability_score trending downward

---

## Likely Causes

- combined effect of:
  - latency increase
  - confidence drop
  - rate limit issues

---

## What to Check

1. Identify which metric changed most
2. Correlate latency vs confidence
3. Check degradation_ratio

---

## Interpretation

- gradual decline → early system regression
- sharp drop → major issue

---

# 4. Release Confidence Drop

## Symptom

- release_confidence below threshold

---

## Likely Causes

- penalty triggered by:
  - latency
  - confidence
  - rate limit drift

---

## What to Check

1. Identify which penalty applied
2. Compare vs previous run
3. Check thresholds crossed

---

## Interpretation

- small drop → caution
- large drop → block release

---

# 5. Rate Limit Issues

## Symptom

- enforcement_rate deviates from ~30.8%

---

## Likely Causes

- incorrect limit logic
- warmup miscount
- backend inconsistency

---

## What to Check

1. total_requests vs blocked_requests
2. first_429_index
3. rate limit configuration

---

## Interpretation

- lower than expected → under-enforcement (risk)
- higher than expected → over-enforcement (user impact)

---

# 6. Flakiness Increase

## Symptom

- flakiness_pct increases

---

## Likely Causes

- unstable tests
- timing issues
- environment variability

---

## What to Check

1. identify flaky tests
2. check retry behavior
3. review test determinism

---

## Interpretation

- high flakiness → unreliable signals
- must fix before trusting results

---

# 7. Cross-Metric Correlation (IMPORTANT)

## Pattern Recognition

### Case A
Latency ↑ + Confidence ↓

→ backend affecting retrieval quality

---

### Case B
Confidence ↓ only

→ retrieval or embeddings issue

---

### Case C
Latency ↑ only

→ performance issue

---

### Case D
Reliability ↓ but metrics stable

→ scoring or weighting issue

---

# Debugging Strategy

Always follow this order:

1. Detect anomaly (metric deviation)
2. Compare vs baseline
3. Check trend across runs
4. Identify affected metric
5. Correlate with other signals
6. Validate root cause

---

# Key Principle

Do not debug metrics in isolation.

Always ask:

→ What changed relative to baseline?  
→ Is this trend consistent?  
→ Which signal explains it?

---

# Goal

Turn raw signals into:

→ root cause  
→ user impact  
→ action  

This is the difference between monitoring and intelligence.