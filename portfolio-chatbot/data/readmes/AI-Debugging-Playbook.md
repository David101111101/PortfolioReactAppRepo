# AI Debugging Playbook — How to Investigate Issues

This guide explains how to debug issues detected in the AI Observability Dashboard.

It answers:

- What does this signal mean?
- What is the likely root cause?
- What should be checked next?

---

# How to Use the AI Debug Buttons

Every major dashboard section has a 💬 button. Clicking it:

1. Pre-fills the chatbot input with the actual metric snapshot for that section
2. Includes real numbers — flakiness %, workflow breakdowns, confidence deltas, severity labels
3. Asks a contextual question so the AI can reason from data, not just general knowledge

You do not need to copy numbers manually. Click 💬 and ask follow-up questions in the chat.

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

## Dashboard Location

- System Health Overview → P95 Latency card (with AI button)
- Regression Impact section → Latency row (% change vs previous run)
- Performance Trends chart → latency line over last 10 runs

---

# 2. Confidence Drops

## Symptom

- avg_confidence decreases
- multilingual variation increases
- min_confidence delta strongly negative in Regression Impact

---

## Likely Causes

- retrieval quality degradation
- embedding drift
- vector DB inconsistency
- prompt changes

---

## What to Check

1. Compare overlap_ratio and rank_shift
2. Identify worst-performing language (Multilingual Quality section)
3. Inspect Language Drift section — which language has the largest negative delta?
4. Check embedding model changes

---

## Interpretation

- small drop → noise
- sustained drop → retrieval issue
- avg stable but min_confidence_delta negative → hidden language-specific regression

---

## Dashboard Location

- System Health Overview → Retrieval Confidence card
- Regression Impact → Avg Confidence row AND Min Confidence row
- Multilingual Retrieval Quality → per-language table with Δ column (true per-language delta)
- Production SLA Compliance → Min Confidence gate (worst-language floor)

---

# 3. Reliability Decrease

## Symptom

- reliability_score trending downward

---

## Likely Causes

- combined effect of:
  - latency increase (35% weight)
  - confidence drop (30% weight)
  - rate limit issues (20% weight)
  - concurrency degradation (15% weight)

---

## What to Check

1. Identify which metric changed most
2. Correlate latency vs confidence
3. Check degradation_ratio
4. Note: reliability_delta in Regression Impact is in **absolute points**, not a percentage

---

## Interpretation

- gradual decline → early system regression
- sharp drop → major issue

---

## Dashboard Location

- System Health Overview → Reliability Score card
- Regression Impact → Reliability row (shows absolute point change, e.g. -3 pts)
- Last 5 Runs Trend → clickable history showing reliability across recent runs

---

# 4. Production SLA Breach

## Symptom

- one or more SLA gates showing BREACH or WATCH in Production SLA Compliance section
- release_confidence below threshold

---

## Likely Causes

- **P95 Latency BREACH** (>5,800 ms) — backend slowdown, increased payload, model latency
- **Avg Confidence BREACH** (<65) — retrieval quality drop, embedding drift, prompt changes
- **Min Confidence BREACH** (<50) — per-language collapse hidden by averages — check Multilingual Retrieval Quality
- **Rate Enforcement BREACH** (deviation >5%) — rate limiter logic error, warmup miscount
- **Degradation BREACH** (>1.20×) — concurrency degradation under load

---

## What to Check

1. Identify which SLA gate is BREACH (check Production SLA Compliance section)
2. Compare vs previous run in Regression Impact section
3. If Min Confidence breached — check Multilingual Retrieval Quality for the specific language
4. Check release_confidence penalty computation — which threshold was crossed?

---

## Interpretation

- WATCH → approaching limits, monitor next run
- BREACH → active investigation required; the live production system is outside defined quality parameters
- Multiple BREACHes → systemic issue, check System Risk Assessment primary signal

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

## Dashboard Location

- System Health Overview → Rate Limit Enforcement card (with AI button)
- Production SLA Compliance → Rate Enforcement gate

---

# 6. Flakiness Increase

## Symptom

- flakiness_pct increases
- E2E Workflow Breakdown shows "degrading" for pr_e2e or deploy_e2e

---

## Likely Causes

- unstable tests
- timing issues
- environment variability
- browser-specific rendering issues (for E2E)

---

## What to Check

1. Test Suites Reliability → Workflow Breakdown table (which workflow is degrading?)
2. Flaky Tests Breakdown → which tests? what severity? recent or stale?
3. Check retry behavior
4. Review test determinism

---

## Important: Weekly Run vs E2E Workflows

The weekly regression run (`workflow_type = weekly_regression_suite`) and E2E pipelines (`pr_e2e`, `deploy_e2e`) are separate entries. The Current State shows the max flakiness across all sources.

If E2E workflows show "degrading" but the weekly run shows 0%, that is correct — they run different tests. The E2E degradation is real and should be investigated.

---

## Interpretation

- high flakiness → unreliable signals
- must fix before trusting regression results

---

## Dashboard Location

- Test Suites Reliability → Current State + Workflow Breakdown + Historical Trend
- Flaky Tests Breakdown → per-test instability table
- Use 💬 AI button — it sends the full snapshot including workflow breakdown and top flaky tests

---

# 7. Multilingual Retrieval Issues

## Symptom

- specific language shows Critical or Risk status
- language drift shows Regression for one or more languages
- min_confidence_delta strongly negative in Regression Impact

---

## Likely Causes

- insufficient training data for that language
- embedding model bias toward English
- chunking producing poor segments for that language
- query translation or preprocessing gap

---

## What to Check

1. Multilingual Retrieval Quality → identify which language has the lowest min_confidence
2. Multilingual Retrieval Quality → check the Δ column — which language has the largest negative delta?
3. Check if the drift is in avg or only in min (instability flag: avg - min > 15)
4. Production SLA Compliance → Min Confidence gate — is it BREACH or WATCH?
5. Inspect retrieval_metrics records for that language

---

## Interpretation

- Specific language regressing = language-targeted issue (embedding, chunking, or data coverage)
- High instability (avg - min > 15) = inconsistent retrieval within that language
- Min Confidence SLA BREACH = at least one language is below 50 — users querying in that language may get near-useless responses

---

## Dashboard Location

- Multilingual Retrieval Quality section (with AI button) — per-language avg/min/Δ/risk table
- Production SLA Compliance → Min Confidence gate (system-level worst-case floor)
- System Risk Assessment → Worst-case Confidence row (shows which language is the floor)

---

# 8. System Risk Assessment Signals

## Symptom

- Regression Severity is "moderate" or "critical"
- User Impact is not "None detected"
- Analysis Confidence is "low"

---

## What Each Signal Means

### Regression Severity

- stable → no significant delta across signals
- minor → small combined change
- moderate → meaningful degradation in one area
- critical → significant combined degradation

### User Impact

- critical_user_impact → min_confidence < 25 — some users may get no useful response
- moderate_user_impact → min_confidence < 40 — degraded quality for some queries
- performance_user_impact → latency spike — users experience slow responses
- no_user_impact → system performing normally

### Primary Signal

- system_degradation → both latency AND confidence moving together → backend issue
- retrieval_regression → min_confidence critically low → vector/embedding issue
- latency_regression → response time spike only → infrastructure issue
- no_signal → no dominant cause detected

### Analysis Confidence

- low (< 3 runs) → signals may be noise; not enough history
- medium (3–5 runs) → moderate certainty
- high (6+ runs) → statistically meaningful trend

---

## Dashboard Location

- System Risk Assessment section (with AI button)
- AI System Intelligence section (with AI button) — narrative summary

---

# 9. Cross-Metric Correlation (IMPORTANT)

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

### Case E
E2E workflows degrading + weekly run healthy

→ browser-level instability — separate investigation needed, not the same as AI regression

---

### Case F
avg_confidence stable + min_confidence_delta strongly negative

→ hidden language-specific regression — check Multilingual Quality (Δ column) and Production SLA Compliance (Min Confidence gate)

---

# Debugging Strategy

Always follow this order:

1. Detect anomaly (metric deviation or status dot)
2. Compare vs baseline
3. Check trend across runs
4. Identify affected metric
5. Correlate with other signals
6. Validate root cause
7. Use the AI Debug button 💬 on the relevant section — it provides the actual numbers

---

# Key Principle

Do not debug metrics in isolation.

Always ask:

→ What changed relative to baseline?  
→ Is this trend consistent?  
→ Which signal explains it?  
→ Does flakiness invalidate the signal?

---

# Goal

Turn raw signals into:

→ root cause  
→ user impact  
→ action  

This is the difference between monitoring and intelligence.

The AI Debug buttons make this conversation-driven — click 💬 on any section to ask the embedded chatbot what the numbers mean and what to do next.
