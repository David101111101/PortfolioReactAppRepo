import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { HeaderDashboard } from "../components/HeaderDashboard";
import "../App.css";
import "../styles/Dashboard.css";
import ChatWidget from "../components/ChatWidget";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Domain types ────────────────────────────────────────────────────────────

type MetricKey = "Latency" | "Reliability" | "Confidence" | "Rate";
type SlaStatus = "green" | "yellow" | "orange" | "red" | null;
type SlaMetric = "latency" | "confidence" | "reliability" | "flakiness";

type Run = {
  run_id: string;
  run_timestamp: string;
  p95_latency: number;
  reliability_score: number;
  min_confidence: number;
  avg_confidence: number;
  enforcement_rate: number;
  avg_rank_shift: number;
};

type TestRun = {
  id: number;
  commit_sha: string;
  workflow_name: string;
  failed: number;
  total_tests: number;
  run_timestamp: string;
};

type FlakyTest = {
  test_name: string;
  flakiness_pct: number;
  flaky_runs: number;
  total_runs: number;
  severity: string;
  recency: string;
  last_seen: string;
};

type LanguageMetric = {
  language: string;
  avg_confidence: number;
  min_confidence: number;
};

type RegressionComparison = {
  latency_pct: number;
  confidence_pct: number;
  reliability_delta: number;
  min_confidence_delta?: number;
};

type E2eWorkflowStability = {
  workflow_type: string;
  avg_flakiness_pct: number;
  prev_flakiness_pct: number | null;
  flakiness_delta: number | null;
  trend_direction: string;
  run_count: number;
};

type RegressionStory = {
  trend_direction: string;
  regression_severity: string;
  primary_signal: string;
  user_impact: string;
  analysis_confidence: string;
};

type FlakinessRun = {
  run_id: string;
  flakiness_pct: number;
};

type FlakinessTrend = {
  run_id: string;
  run_timestamp: string;
  flakiness_pct: number;
};

// ─── Component prop types ─────────────────────────────────────────────────────

type MetricProps = {
  title: string;
  value: string;
  subtitle?: ReactNode;
  status?: SlaStatus;
  onClick: () => void;
  onAskAI?: () => void;
};

type InsightProps = {
  metric: MetricKey;
  run?: Run | null;
  previousRun?: Run | null;
  recentRuns?: Run[];
};

type LazyViewportProps = {
  children: ReactNode;
  minHeight: number;
  rootMargin?: string;
};

// ─── Latency baseline constants ──────────────────────────────────────────────
// Derived from historical P95 values: [5171, 5113, 5625, 5820] → median ≈ 5400 ms
const LATENCY_EXPECTED = 5400;
const LATENCY_DEGRADED_THRESHOLD = 5800;

// ─── Confidence baseline constants ───────────────────────────────────────────
// Derived from historical avg_confidence: [81.3, 83.3, 80.0, 80.7] → median ≈ 81
const CONFIDENCE_EXPECTED = 81;
const CONFIDENCE_WARN_THRESHOLD = 75;

// ─── Reliability baseline constants ──────────────────────────────────────────
// Derived from historical reliability_score: [92, 91, 90, 89] → median ≈ 91
const RELIABILITY_EXPECTED = 91;
const RELIABILITY_WARN_THRESHOLD = 88;

// ─── Rate limit constants ─────────────────────────────────────────────────────
// limit=10 req/IP, warmup=1 pre-loop request; remaining before 429 = 10 - 1 = 9
// Tracked loop = 13 requests → expected blocked = 13 - 9 = 4 → 30.8%
const RATE_LIMIT = 10;
const RATE_WARMUP = 1;
const RATE_TOTAL_REQUESTS = 13;
const RATE_EXPECTED_BLOCKED = RATE_TOTAL_REQUESTS - (RATE_LIMIT - RATE_WARMUP); // 4
const RATE_EXPECTED = RATE_EXPECTED_BLOCKED / RATE_TOTAL_REQUESTS; // ≈ 0.3077

// ─── Pure helpers (no component state) ───────────────────────────────────────

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatFixed(value: number | null | undefined, digits: number, suffix = "") {
  return isFiniteNumber(value) ? `${value.toFixed(digits)}${suffix}` : "N/A";
}

function formatPercentFromWhole(value: number | null | undefined, digits = 1) {
  return isFiniteNumber(value) ? `${value.toFixed(digits)}%` : "N/A";
}

function formatPercentFromRatio(value: number | null | undefined, digits = 1) {
  return isFiniteNumber(value) ? `${(value * 100).toFixed(digits)}%` : "N/A";
}

function sectionId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStatusColor(value: number | null | undefined, metric: SlaMetric): SlaStatus {
  if (!isFiniteNumber(value)) return null;
  switch (metric) {
    case "latency":
      return value < 5400 ? "green" : value < 5800 ? "yellow" : "red";
    case "confidence":
      return value < 40 ? "red" : value < 70 ? "yellow" : "green";
    case "reliability":
      return value > 90 ? "green" : value > 85 ? "yellow" : "red";
    case "flakiness":
      return value < 1 ? "green" : value < 3 ? "yellow" : "red";
    default:
      return null;
  }
}

// Aligns with getLanguageRisk thresholds: Critical <60, Risk 60–75, Healthy ≥75
function getLanguageConfidenceStatus(value: number | null | undefined): SlaStatus {
  if (!isFiniteNumber(value)) return null;
  if (value < 60) return "red";
  if (value < 75) return "yellow";
  return "green";
}

function getDriftStatus(label: string): SlaStatus {
  if (label === "Regression") return "red";
  if (label === "Drop") return "yellow";
  if (label === "Improvement" || label === "Stable") return "green";
  return null;
}

// Delta-based SLA status — direction tells us whether going up or down is bad
function getDeltaStatus(
  value: number | null | undefined,
  direction: "lower-is-better" | "higher-is-better"
): SlaStatus {
  if (!isFiniteNumber(value)) return null;
  if (direction === "lower-is-better") {
    // e.g. latency: positive change = bad
    if (value > 0.2) return "red";
    if (value > 0) return "yellow";
    return "green";
  } else {
    // e.g. confidence/reliability: negative change = bad
    if (value < -0.1) return "red";
    if (value < 0) return "yellow";
    return "green";
  }
}

// Deviation-based latency signal vs historical baseline
function getLatencyDeviationStatus(actual: number | null | undefined): {
  deltaPct: number;
  deltaMs: number;
  status: SlaStatus;
  label: string;
} | null {
  if (!isFiniteNumber(actual)) return null;
  const deltaMs = actual - LATENCY_EXPECTED;
  const deltaPct = deltaMs / LATENCY_EXPECTED;
  let status: SlaStatus;
  let label: string;
  if (deltaPct <= -0.05) { status = "green"; label = "Strong performance"; }
  else if (deltaPct <= 0) { status = "green"; label = "Healthy"; }
  else if (deltaPct <= 0.09) { status = "yellow"; label = "Slight degradation"; }
  else if (deltaPct <= 0.15) { status = "orange"; label = "Degraded"; }
  else { status = "red"; label = "Severe"; }
  return { deltaPct, deltaMs, status, label };
}

// Deviation-based confidence signal vs historical baseline
function getConfidenceDeviationStatus(actual: number | null | undefined): {
  deltaPct: number;
  delta: number;
  status: SlaStatus;
  label: string;
} | null {
  if (!isFiniteNumber(actual)) return null;
  const delta = actual - CONFIDENCE_EXPECTED;
  const deltaPct = delta / CONFIDENCE_EXPECTED;
  let status: SlaStatus;
  let label: string;
  if (deltaPct >= 0.03) { status = "green"; label = "Improved"; }
  else if (deltaPct >= -0.03) { status = "green"; label = "Stable"; }
  else if (deltaPct >= -0.08) { status = "yellow"; label = "Slight degradation"; }
  else if (deltaPct >= -0.15) { status = "orange"; label = "Degraded"; }
  else { status = "red"; label = "Severe regression"; }
  return { deltaPct, delta, status, label };
}

// Deviation-based reliability signal vs historical baseline
function getReliabilityDeviationStatus(actual: number | null | undefined): {
  deltaPct: number;
  delta: number;
  status: SlaStatus;
  label: string;
} | null {
  if (!isFiniteNumber(actual)) return null;
  const delta = actual - RELIABILITY_EXPECTED;
  const deltaPct = delta / RELIABILITY_EXPECTED;
  let status: SlaStatus;
  let label: string;
  if (deltaPct >= 0.02) { status = "green"; label = "Improved"; }
  else if (deltaPct >= -0.02) { status = "green"; label = "Stable"; }
  else if (deltaPct >= -0.05) { status = "yellow"; label = "Slight degradation"; }
  else if (deltaPct >= -0.10) { status = "orange"; label = "Degraded"; }
  else { status = "red"; label = "Severe"; }
  return { deltaPct, delta, status, label };
}

// Deviation-based rate limit correctness signal
function getRateLimitSeverity(rate: number | null | undefined) {
  if (!isFiniteNumber(rate)) return null;
  const delta = rate - RATE_EXPECTED;
  const absDelta = Math.abs(delta);
  let status: SlaStatus;
  let label: string;
  if (absDelta <= 0.02) { status = "green"; label = "Healthy"; }
  else if (absDelta <= 0.05) { status = "yellow"; label = "Slight drift"; }
  else if (absDelta <= 0.10) { status = "orange"; label = "Degraded"; }
  else { status = "red"; label = "Severe"; }
  return { delta, absDelta, status, label };
}

function getSeverityClass(severity: string | null | undefined): string {
  if (severity === "high") return "dashboard-severity-high";
  if (severity === "medium") return "dashboard-severity-medium";
  return "dashboard-severity-low";
}

// ─── Run Snapshot Builder ─────────────────────────────────────────────────────

function buildRunSnapshotContext(current: Run, previous: Run | null): string {
  const fmt = (v: number | null | undefined, digits: number, suffix = "") =>
    typeof v === "number" && Number.isFinite(v) ? `${v.toFixed(digits)}${suffix}` : "N/A";

  const fmtPct = (v: number | null | undefined, digits = 1) =>
    typeof v === "number" && Number.isFinite(v) ? `${(v * 100).toFixed(digits)}%` : "N/A";

  const delta = (c: number | null | undefined, p: number | null | undefined, digits: number, suffix = "") => {
    if (typeof c !== "number" || !Number.isFinite(c) || typeof p !== "number" || !Number.isFinite(p)) return "N/A";
    const d = c - p;
    return `${d >= 0 ? "+" : ""}${d.toFixed(digits)}${suffix}`;
  };

  const deltaPct = (c: number | null | undefined, p: number | null | undefined, digits = 1) => {
    if (typeof c !== "number" || !Number.isFinite(c) || typeof p !== "number" || !Number.isFinite(p) || p === 0) return "N/A";
    const d = ((c - p) / Math.abs(p)) * 100;
    return `${d >= 0 ? "+" : ""}${d.toFixed(digits)}%`;
  };

  const lines: string[] = [
    "=== RUN ANALYSIS CONTEXT ===",
    "",
    `CURRENT RUN: ${current.run_id}`,
    `Timestamp: ${current.run_timestamp}`,
    `P95 Latency: ${fmt(current.p95_latency, 0, " ms")}`,
    `Reliability Score: ${fmt(current.reliability_score, 1)}`,
    `Avg Confidence: ${fmt(current.avg_confidence, 1)}`,
    `Min Confidence: ${fmt(current.min_confidence, 1)}`,
    `Enforcement Rate: ${fmtPct(current.enforcement_rate)}`,
    `Avg Rank Shift: ${fmt(current.avg_rank_shift, 3)}`,
    "",
  ];

  if (previous) {
    lines.push(
      `PREVIOUS RUN: ${previous.run_id}`,
      `Timestamp: ${previous.run_timestamp}`,
      `P95 Latency: ${fmt(previous.p95_latency, 0, " ms")}`,
      `Reliability Score: ${fmt(previous.reliability_score, 1)}`,
      `Avg Confidence: ${fmt(previous.avg_confidence, 1)}`,
      `Min Confidence: ${fmt(previous.min_confidence, 1)}`,
      `Enforcement Rate: ${fmtPct(previous.enforcement_rate)}`,
      `Avg Rank Shift: ${fmt(previous.avg_rank_shift, 3)}`,
      "",
      "DELTAS (current − previous):",
      `P95 Latency: ${delta(current.p95_latency, previous.p95_latency, 0, " ms")} (${deltaPct(current.p95_latency, previous.p95_latency)})`,
      `Reliability Score: ${delta(current.reliability_score, previous.reliability_score, 1)} (${deltaPct(current.reliability_score, previous.reliability_score)})`,
      `Avg Confidence: ${delta(current.avg_confidence, previous.avg_confidence, 1)} (${deltaPct(current.avg_confidence, previous.avg_confidence)})`,
      `Min Confidence: ${delta(current.min_confidence, previous.min_confidence, 1)} (${deltaPct(current.min_confidence, previous.min_confidence)})`,
      `Enforcement Rate: ${delta(current.enforcement_rate, previous.enforcement_rate, 4)} (${deltaPct(current.enforcement_rate, previous.enforcement_rate)})`,
      `Avg Rank Shift: ${delta(current.avg_rank_shift, previous.avg_rank_shift, 3)}`,
      "",
    );
  } else {
    lines.push("PREVIOUS RUN: Not available (this is the earliest recorded run)", "");
  }

  lines.push(
    "FIELD LEGEND:",
    "- P95 Latency: milliseconds (lower is better)",
    "- Reliability Score: 0–100 scale (higher is better)",
    "- Avg Confidence / Min Confidence: 0–100 scale (higher is better)",
    "- Enforcement Rate: already formatted as a percentage (rate limiting activity)",
    "- Avg Rank Shift: rank positions (lower = more stable retrieval ordering)",
    "",
    "=== END CONTEXT ===",
  );

  return lines.join("\n");
}

// ─── Helpers (outside component to avoid recreation on every render) ─────────

function formatDateTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 120);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [trend, setTrend] = useState<Run[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [story, setStory] = useState<RegressionStory | null>(null);
  const [comparison, setComparison] = useState<RegressionComparison | null>(null);
  const [languageMetrics, setLanguageMetrics] = useState<LanguageMetric[]>([]);
  const [flakiness, setFlakiness] = useState<FlakinessRun | null>(null);
  const [flakinessTrend, setFlakinessTrend] = useState<FlakinessTrend[]>([]);
  const [flakyTests, setFlakyTests] = useState<FlakyTest[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [languageTrend, setLanguageTrend] = useState<{ language: string; delta: number | null }[]>([]);
  const [e2eStability, setE2eStability] = useState<E2eWorkflowStability[]>([]);
  const [e2eChartRuns, setE2eChartRuns] = useState<Array<{ workflow_type: string; failed: number; total_tests: number; run_timestamp: string }>>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [chatQuery, setChatQuery] = useState<string | undefined>(undefined);
  const [chatContext, setChatContext] = useState<string | undefined>(undefined);

  const runContext = useMemo(() => {
    if (!selectedRun) return undefined;
    const idx = runs.findIndex((r) => r.run_id === selectedRun.run_id);
    const previousRun = idx >= 0 && idx + 1 < runs.length ? runs[idx + 1] : null;
    return buildRunSnapshotContext(selectedRun, previousRun);
  }, [selectedRun, runs]);

  const chatGreeting = useMemo(() => {
    if (!selectedRun || !runContext) return undefined;
    const runShort = selectedRun.run_id.split("-").pop();
    return `I have access to Run ${runShort} — Reliability ${isFiniteNumber(selectedRun.reliability_score) ? selectedRun.reliability_score.toFixed(1) : "N/A"}, P95 ${isFiniteNumber(selectedRun.p95_latency) ? `${selectedRun.p95_latency} ms` : "N/A"}, Confidence avg ${isFiniteNumber(selectedRun.avg_confidence) ? selectedRun.avg_confidence.toFixed(1) : "N/A"}. What do you want to investigate?\n\nConversations may be logged, but no personal information is stored.`;
  }, [selectedRun, runContext]);

  // ── Mount-time fetches ────────────────────────────────────────────────────────
  // Critical fetches run together — any failure shows an error banner.
  // Non-critical fetches (language trend, e2e stability, e2e chart data) run
  // independently and fail silently so they cannot break the main data load.
  useEffect(() => {
    if (!hasSupabaseConfig) return;

    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

    // ── Critical: core dashboard data ─────────────────────────────────────────
    // regression_run_comparison has no run_timestamp column — order by run_id desc.
    // Each individual fetch swallows its own network errors; only missing run data
    // triggers the error state so one bad view cannot blank the whole dashboard.
    const safeJson = (res: Response | null) => {
      if (!res || !res.ok) return Promise.resolve(null);
      return res.json().catch(() => null);
    };

    const loadCritical = async () => {
      const [compRes, storyRes, runsRes, flakyTrendRes, flakyTestsRes, testRunsRes] =
        await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/regression_run_comparison?order=run_id.desc&limit=1`, { headers }).catch(() => null),
          fetch(`${supabaseUrl}/rest/v1/regression_story?order=run_timestamp.desc&limit=1`, { headers }).catch(() => null),
          fetch(`${supabaseUrl}/rest/v1/regression_run_summary?order=run_timestamp.desc`, { headers }).catch(() => null),
          fetch(`${supabaseUrl}/rest/v1/flakiness_trend?order=run_timestamp.desc&limit=10`, { headers }).catch(() => null),
          fetch(`${supabaseUrl}/rest/v1/test_flakiness_enriched?order=flakiness_pct.desc&limit=15`, { headers }).catch(() => null),
          fetch(`${supabaseUrl}/rest/v1/test_runs?order=run_timestamp.desc&limit=10`, { headers }).catch(() => null),
        ]);

      const [compData, storyData, runsData, flakyTrendData, flakyTestsData, testRunsData] =
        await Promise.all([
          safeJson(compRes),
          safeJson(storyRes),
          safeJson(runsRes),
          safeJson(flakyTrendRes),
          safeJson(flakyTestsRes),
          safeJson(testRunsRes),
        ]);

      // DEV-only: log what columns each view returns to catch field-name mismatches
      if (import.meta.env.DEV) {
        console.log("[Dashboard] regression_run_comparison row:", compData?.[0]);
        console.log("[Dashboard] regression_run_summary row:", Array.isArray(runsData) ? runsData[0] : runsData);
        console.log("[Dashboard] regression_story row:", storyData?.[0]);
      }

      if (!Array.isArray(runsData) || runsData.length === 0) {
        setFetchError("No run data found. Run a CI pipeline to populate metrics.");
        setIsLoadingRuns(false);
        return;
      }

      setComparison(compData?.[0] ?? null);
      setStory(storyData?.[0] ?? null);
      const normalized = runsData as Run[];
      setRuns(normalized);
      setTrend(normalized.slice(0, 10));
      setSelectedRun(normalized[0]);
      setFlakinessTrend(Array.isArray(flakyTrendData) ? flakyTrendData : []);
      setFlakyTests(Array.isArray(flakyTestsData) ? flakyTestsData : []);
      setTestRuns(Array.isArray(testRunsData) ? testRunsData : []);
      setIsLoadingRuns(false);
    };

    loadCritical().catch((err) => {
      console.error("Dashboard critical fetch error:", err);
      setFetchError("Failed to load dashboard data. Please refresh the page.");
      setIsLoadingRuns(false);
    });

    // ── Non-critical: per-language drift ──────────────────────────────────────
    fetch(`${supabaseUrl}/rest/v1/retrieval_language_trend?order=run_id.desc&limit=30`, { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((langTrendData) => {
        if (!Array.isArray(langTrendData)) return;
        const seen = new Set<string>();
        const mapped: { language: string; delta: number | null }[] = [];
        for (const row of langTrendData) {
          if (!seen.has(row.language)) {
            seen.add(row.language);
            mapped.push({ language: row.language, delta: isFiniteNumber(row.delta) ? row.delta : null });
          }
        }
        setLanguageTrend(mapped);
      })
      .catch(() => {});

    // ── Non-critical: e2e workflow stability (current/prev summary) ───────────
    fetch(`${supabaseUrl}/rest/v1/e2e_workflow_stability`, { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((e2eData) => { if (Array.isArray(e2eData)) setE2eStability(e2eData); })
      .catch(() => {});

    // ── Non-critical: e2e test runs for dual-line historical chart ─────────────
    fetch(
      `${supabaseUrl}/rest/v1/test_runs?workflow_type=in.(pr_e2e,deploy_e2e)&order=run_timestamp.asc&limit=30`,
      { headers }
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => { if (Array.isArray(data)) setE2eChartRuns(data); })
      .catch(() => {});
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  // ── Per-run fetches — cancelled when run changes or component unmounts ───────
  useEffect(() => {
    if (!hasSupabaseConfig || !selectedRun) return;

    const controller = new AbortController();
    const safeRunId = encodeURIComponent(selectedRun.run_id);
    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

    Promise.all([
      fetch(`${supabaseUrl}/rest/v1/retrieval_language_summary?run_id=eq.${safeRunId}`, { headers, signal: controller.signal }),
      fetch(`${supabaseUrl}/rest/v1/flakiness_run_summary?run_id=eq.${safeRunId}`, { headers, signal: controller.signal }),
    ])
      .then((responses) => {
        for (const res of responses) {
          if (!res.ok) throw new Error(`Per-run API error: ${res.status}`);
        }
        return Promise.all(responses.map((r) => r.json()));
      })
      .then(([langData, flakinessData]) => {
        setLanguageMetrics(Array.isArray(langData) ? langData : []);
        setFlakiness(Array.isArray(flakinessData) ? (flakinessData[0] ?? null) : null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Per-run fetch error:", err);
        }
      });

    return () => controller.abort();
  }, [selectedRun, hasSupabaseConfig, supabaseKey, supabaseUrl]);

  // ── Derived flakiness values ────────────────────────────────────────────────
  const hasFlakinessTrend = flakinessTrend.length > 0;
  const latestFlaky = hasFlakinessTrend ? flakinessTrend[0]?.flakiness_pct : null;
  const prevFlaky = flakinessTrend.length > 1 ? flakinessTrend[1]?.flakiness_pct : null;

  // Per-run flakiness_run_summary is authoritative; fall back to latest trend value,
  // then to the max avg_flakiness_pct across E2E workflows.
  // The weekly regression run may have flaky=0 while separate pr_e2e/deploy_e2e runs
  // show real instability — the E2E max ensures Current State reflects the worst signal.
  const effectiveFlakinessPct = (() => {
    if (isFiniteNumber(flakiness?.flakiness_pct) && flakiness!.flakiness_pct > 0)
      return flakiness!.flakiness_pct;
    if (isFiniteNumber(latestFlaky) && latestFlaky > 0)
      return latestFlaky;
    const maxE2e = e2eStability.reduce<number | null>((acc, w) => {
      if (!isFiniteNumber(w.avg_flakiness_pct)) return acc;
      return acc === null ? w.avg_flakiness_pct : Math.max(acc, w.avg_flakiness_pct);
    }, null);
    if (isFiniteNumber(maxE2e) && maxE2e > 0) return maxE2e;
    return flakiness?.flakiness_pct ?? null;
  })();
  const flakinessDelta =
    isFiniteNumber(latestFlaky) && isFiniteNumber(prevFlaky) ? latestFlaky - prevFlaky : null;

  const flakinessChartData =
    flakinessTrend.length > 0
      ? [...flakinessTrend]
          .sort((a, b) => new Date(a.run_timestamp).getTime() - new Date(b.run_timestamp).getTime())
          .map((entry) => ({
            date: formatDateTime(entry.run_timestamp),
            flakiness: entry.flakiness_pct,
          }))
      : [];

  const getFlakinessRisk = (value: number | null | undefined) => {
    if (!isFiniteNumber(value)) return "No data";
    if (value < 1) return "Healthy";
    if (value < 3) return "Warning";
    return "Critical";
  };

  // ── Event handlers ──────────────────────────────────────────────────────────
  const handleRunChange = (id: string) => {
    const run = runs.find((currentRun) => currentRun.run_id === id);
    if (run) setSelectedRun(run);
  };

  // ── Label helpers ───────────────────────────────────────────────────────────
  const getRankShiftLabel = (value: number | null | undefined) => {
    if (!isFiniteNumber(value)) return "No drift data";
    if (value < 0.2) return "Stable retrieval";
    if (value < 0.5) return "Moderate drift";
    return "High ranking instability";
  };

  const getLatencyDeltaLabel = (pct: number | null | undefined) => {
    if (!isFiniteNumber(pct)) return "No comparison data";
    if (pct > 0.2) return "Significant slowdown";
    if (pct > 0) return "Slight slowdown";
    if (pct > -0.2) return "Slight improvement";
    return "Major improvement";
  };

  const getConfidenceDeltaLabel = (pct: number | null | undefined) => {
    if (!isFiniteNumber(pct)) return "No comparison data";
    if (pct < -0.1) return "Confidence drop";
    if (pct < 0) return "Slight drop";
    if (pct < 0.1) return "Stable";
    return "Improved";
  };

  // ── Language helpers ────────────────────────────────────────────────────────
  const languageMap: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
    zh: "Chinese",
    ja: "Japanese",
  };

  const getLanguageName = (code: string) => languageMap[code] || code;

  const getLanguageRisk = (language: LanguageMetric) => {
    if (!isFiniteNumber(language.min_confidence)) return "No language data";
    if (language.min_confidence < 60) return "Critical";
    if (language.min_confidence < 75) return "Risk";
    return "Healthy";
  };

  const isUnstable = (language: LanguageMetric) =>
    isFiniteNumber(language.avg_confidence) &&
    isFiniteNumber(language.min_confidence) &&
    language.avg_confidence - language.min_confidence > 15;

  // ── Derived language trend map (language code → delta) ─────────────────────
  const languageTrendMap = useMemo(
    () => new Map(languageTrend.map((e) => [e.language, e.delta])),
    [languageTrend]
  );

  // ── Dual-line E2E chart data (pr_e2e vs deploy_e2e failure rate over time) ──
  const e2eDualChartData = useMemo(() => {
    if (e2eChartRuns.length === 0) return [];
    const prMap = new Map<string, number>();
    const deployMap = new Map<string, number>();
    for (const r of e2eChartRuns) {
      const rate = isFiniteNumber(r.failed) && isFiniteNumber(r.total_tests) && r.total_tests > 0
        ? (r.failed / r.total_tests) * 100
        : 0;
      if (r.workflow_type === "pr_e2e") prMap.set(r.run_timestamp, rate);
      else if (r.workflow_type === "deploy_e2e") deployMap.set(r.run_timestamp, rate);
    }
    const allTs = Array.from(new Set([...prMap.keys(), ...deployMap.keys()])).sort();
    return allTs.map((ts) => ({
      date: formatDateTime(ts),
      pr_e2e: prMap.get(ts) ?? null,
      deploy_e2e: deployMap.get(ts) ?? null,
    }));
  }, [e2eChartRuns]);

  // ── System Risk helpers ──────────────────────────────────────────────────────
  const getUserImpactLabel = (impact: string | null | undefined): { label: string; status: SlaStatus } => {
    switch (impact) {
      case "critical_user_impact": return { label: "Critical — users severely affected", status: "red" };
      case "moderate_user_impact": return { label: "Moderate — degraded experience", status: "orange" };
      case "performance_user_impact": return { label: "Performance — latency noticeable", status: "yellow" };
      case "no_user_impact": return { label: "None detected", status: "green" };
      default: return { label: "Unknown", status: null };
    }
  };

  const getPrimarySignalLabel = (signal: string | null | undefined): string => {
    switch (signal) {
      case "system_degradation": return "System-wide degradation (latency + confidence)";
      case "retrieval_regression": return "Retrieval regression (min confidence critical)";
      case "latency_regression": return "Latency regression (response time spike)";
      case "no_signal": return "No regression signal";
      default: return signal ?? "Unknown";
    }
  };

  // ── Guard: missing config ───────────────────────────────────────────────────
  if (!hasSupabaseConfig) {
    return (
      <section id={sectionId("AI System Dashboard")}>
        <section className="dashboard-card" id={sectionId("Dashboard Configuration")}>
          <p>Dashboard data is not configured for this Vite app.</p>
          <p>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the active .env file.</p>
        </section>
      </section>
    );
  }

  if (isLoadingRuns) {
    return (
      <section className="dashboard-page" id={sectionId("AI System Dashboard")}>
        <HeaderDashboard />
        <section className="bg bg-dark" aria-hidden="true" />
        <section className="bg bg-light" aria-hidden="true" />
        <main id="content" className="dashboard-main">
          <section className="dashboard-card">
            <p>Loading dashboard…</p>
          </section>
        </main>
      </section>
    );
  }

  if (!selectedRun) {
    return (
      <section className="dashboard-page">
        No run data available. Run a CI pipeline to populate metrics.
      </section>
    );
  }

  // ── Derived chart data ──────────────────────────────────────────────────────
  const chronologicalTrend = [...trend].sort(
    (a, b) => new Date(a.run_timestamp).getTime() - new Date(b.run_timestamp).getTime()
  );

  const chartData = chronologicalTrend.map((entry) => ({
    date: formatDateTime(entry.run_timestamp),
    latency: entry.p95_latency,
    confidence: entry.avg_confidence,
    reliability: entry.reliability_score,
    rate: entry.enforcement_rate,
  }));

  // ── Failure correlation data ────────────────────────────────────────────────
  // Join by closest timestamp since regression runs (UUID run_id) and test_runs
  // (numeric id) share no common key — timestamp is the best available signal.
  const correlationData = chronologicalTrend.map((entry) => {
    const entryTime = new Date(entry.run_timestamp).getTime();
    let closestTr: TestRun | null = null;
    let minDiff = Infinity;
    for (const tr of testRuns) {
      const diff = Math.abs(new Date(tr.run_timestamp).getTime() - entryTime);
      if (diff < minDiff) { minDiff = diff; closestTr = tr; }
    }
    const failure_rate_pct =
      closestTr && isFiniteNumber(closestTr.failed) && isFiniteNumber(closestTr.total_tests) && closestTr.total_tests > 0
        ? (closestTr.failed / closestTr.total_tests) * 100
        : null;
    return {
      date: formatDateTime(entry.run_timestamp),
      latency: entry.p95_latency,
      failure_rate_pct,
    };
  });

  const hasCorrelationData = correlationData.some((d) => isFiniteNumber(d.latency));

  const correlationInsight = (() => {
    const valid = correlationData.filter(
      (d): d is { date: string; latency: number; failure_rate_pct: number } =>
        isFiniteNumber(d.latency) && isFiniteNumber(d.failure_rate_pct)
    );
    if (valid.length < 2) return null;
    const last = valid[valid.length - 1];
    const prev = valid[valid.length - 2];
    return last.latency > prev.latency && last.failure_rate_pct > prev.failure_rate_pct
      ? "Possible system-induced failures"
      : "No clear correlation";
  })();

  // ── Other derived values ────────────────────────────────────────────────────
  const latest = trend[0];
  const previous = trend.length > 1 ? trend[1] : null;
  const last5 = trend.slice(0, 5);
  const latencySpike =
    isFiniteNumber(latest?.p95_latency) &&
    isFiniteNumber(previous?.p95_latency) &&
    latest.p95_latency > previous.p95_latency * 1.2;

  const sortedLanguages = (languageMetrics ?? [])
    .slice()
    .sort((a, b) => a.min_confidence - b.min_confidence);
  const worstLanguage = sortedLanguages.length > 0 ? sortedLanguages[0] : null;
  const hasLanguageMetrics = languageMetrics.length > 0;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <section className="dashboard-page" id={sectionId("AI System Dashboard")}>
      <HeaderDashboard />
      <section className="bg bg-dark" aria-hidden="true" />
      <section className="bg bg-light" aria-hidden="true" />

      <main id="content" className="dashboard-main">

        {fetchError && (
          <section className="dashboard-card" role="alert">
            <p style={{ color: "var(--color-red, #e53e3e)" }}>{fetchError}</p>
          </section>
        )}

        {/* ── Run Selector ──────────────────────────────────────────────────── */}
        <section className="dashboard-card" id={sectionId("Run Selector")}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2>Select Evaluation Run</h2>
              {runContext && (
                <button
                  type="button"
                  className="dashboard-scroll-top"
                  style={{ position: "static", width: 28, height: 28, fontSize: 14 }}
                  aria-label="Ask AI about this run"
                  title="Ask AI about this run"
                  onClick={() => setChatQuery("Summarize the current run and highlight anything that needs attention.")}
                >
                  💬
                </button>
              )}
          </div>
          <p className="dashboard-section-desc">
            Historical intelligence layer built on top of a <strong>Multilingual Retrieval-Augmented Generation (RAG) system</strong>. <br />
            It transforms raw QA metrics into actionable signals that answer:<br />
            -Is the system accurate, by how much, why, and who is impacted?<br />

            Sections with 💬 "Debug with AI" button inject real metric data directly into the chatbot context, turning this dashboard into an interactive debugging session.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <label htmlFor="run-selector">Select Run:</label>
            <select
              id="run-selector"
              className="dashboard-select"
              value={selectedRun.run_id}
              onChange={(e) => handleRunChange(e.target.value)}
            >
              {runs.map((run) => (
                <option key={run.run_id} value={run.run_id}>
                  Run {run.run_id.split("-").pop()} — {formatDateTime(run.run_timestamp)}
                </option>
              ))}
            </select>
          </div>
          <p className="dashboard-section-desc">
            Each run reflects a fully automated test suite
            execution and AI regression analysis.
          </p>
        </section>

        {/* ── System Health Overview ─────────────────────────────────────────── */}
        <section className="dashboard-card" id={sectionId("Key Metrics")}>
          <h2>System Health Overview</h2>
          <p className="dashboard-section-desc">
            Key performance indicators for reliability, latency, and retrieval quality. Click any
            card to drill into its historical trend.
          </p>
          <section className="dashboard-grid">
            <Metric
              title="P95 Latency"
              value={isFiniteNumber(selectedRun.p95_latency) ? `${selectedRun.p95_latency} ms` : "N/A"}
              status={getLatencyDeviationStatus(selectedRun.p95_latency)?.status ?? null}
              onAskAI={runContext ? () => setChatQuery("Analyze P95 latency for this run. Is it within baseline? How does it compare to the previous run?") : undefined}
              subtitle={(() => {
                const dev = getLatencyDeviationStatus(selectedRun.p95_latency);
                if (!dev) return "No latency data";
                const sign = dev.deltaMs >= 0 ? "+" : "";
                const prevLatency = previous?.p95_latency;
                const trendPct =
                  isFiniteNumber(prevLatency) && isFiniteNumber(selectedRun.p95_latency)
                    ? ((selectedRun.p95_latency - prevLatency) / prevLatency * 100).toFixed(1)
                    : null;
                return (
                  <>
                    <div>Baseline: {LATENCY_EXPECTED} ms</div>
                    <div>{sign}{dev.deltaMs} ms ({sign}{(dev.deltaPct * 100).toFixed(1)}%) vs baseline</div>
                    {trendPct !== null && (
                      <div>{Number(trendPct) >= 0 ? "+" : ""}{trendPct}% vs previous run</div>
                    )}
                  </>
                );
              })()}
              onClick={() => setSelectedMetric("Latency")}
            />
            <Metric
              title="Reliability"
              value={isFiniteNumber(selectedRun.reliability_score) ? `${selectedRun.reliability_score.toFixed(1)}` : "N/A"}
              status={getReliabilityDeviationStatus(selectedRun.reliability_score)?.status ?? null}
              onAskAI={runContext ? () => setChatQuery("Analyze reliability for this run. What's causing any deviation from baseline and how does it compare to the previous run?") : undefined}
              subtitle={(() => {
                const dev = getReliabilityDeviationStatus(selectedRun.reliability_score);
                if (!dev) return "No reliability data";
                const sign = dev.delta >= 0 ? "+" : "";
                const prevRel = previous?.reliability_score;
                const trendPct =
                  isFiniteNumber(prevRel) && isFiniteNumber(selectedRun.reliability_score)
                    ? ((selectedRun.reliability_score - prevRel) / prevRel * 100).toFixed(1)
                    : null;
                return (
                  <>
                    <div>Baseline: {RELIABILITY_EXPECTED}</div>
                    <div>{sign}{dev.delta.toFixed(1)} ({sign}{(dev.deltaPct * 100).toFixed(1)}%) vs baseline</div>
                    {trendPct !== null && (
                      <div>{Number(trendPct) >= 0 ? "+" : ""}{trendPct}% vs previous run</div>
                    )}
                  </>
                );
              })()}
              onClick={() => setSelectedMetric("Reliability")}
            />
            <Metric
              title="Confidence"
              value={isFiniteNumber(selectedRun.avg_confidence) ? `${selectedRun.avg_confidence.toFixed(1)}` : "N/A"}
              status={getConfidenceDeviationStatus(selectedRun.avg_confidence)?.status ?? null}
              onAskAI={runContext ? () => setChatQuery("Analyze retrieval confidence for this run. Is avg or min confidence a concern? How does it compare to the previous run?") : undefined}
              subtitle={(() => {
                const dev = getConfidenceDeviationStatus(selectedRun.avg_confidence);
                if (!dev) return "No confidence data";
                const sign = dev.delta >= 0 ? "+" : "";
                const prevConf = previous?.avg_confidence;
                const trendPct =
                  isFiniteNumber(prevConf) && isFiniteNumber(selectedRun.avg_confidence)
                    ? ((selectedRun.avg_confidence - prevConf) / prevConf * 100).toFixed(1)
                    : null;
                return (
                  <>
                    <div>Baseline: {CONFIDENCE_EXPECTED}</div>
                    <div>{sign}{dev.delta.toFixed(1)} ({sign}{(dev.deltaPct * 100).toFixed(1)}%) vs baseline</div>
                    {trendPct !== null && (
                      <div>{Number(trendPct) >= 0 ? "+" : ""}{trendPct}% vs previous run</div>
                    )}
                  </>
                );
              })()}
              onClick={() => setSelectedMetric("Confidence")}
            />
            <Metric
              title="Rate Limit"
              value={isFiniteNumber(selectedRun.enforcement_rate)
                ? `${(selectedRun.enforcement_rate * 100).toFixed(1)}%`
                : "N/A"}
              status={getRateLimitSeverity(selectedRun.enforcement_rate)?.status ?? null}
              onAskAI={runContext ? () => setChatQuery("Analyze rate limit enforcement for this run. Is the enforcement rate within expected range and what does any deviation indicate?") : undefined}
              subtitle={(() => {
                const dev = getRateLimitSeverity(selectedRun.enforcement_rate);
                if (!dev) return "No rate-limit data";
                const blocked = Math.round(selectedRun.enforcement_rate * RATE_TOTAL_REQUESTS);
                const sign = dev.delta >= 0 ? "+" : "";
                return (
                  <>
                    <div>{dev.label} — Expected: {(RATE_EXPECTED * 100).toFixed(1)}%</div>
                    <div>{sign}{(dev.delta * 100).toFixed(1)}% vs baseline</div>
                    <div>Blocked: {blocked} / {RATE_TOTAL_REQUESTS} requests</div>
                  </>
                );
              })()}
              onClick={() => setSelectedMetric("Rate")}
            />
          </section>
        </section>

        {/* ── Metric Drill-down Trend ────────────────────────────────────────── */}
        {selectedMetric && (
          <section className="dashboard-card" id={sectionId(`${selectedMetric} Trend`)}>
            <h2>{selectedMetric} Trend</h2>
            {latencySpike && selectedMetric === "Latency" && (
              <p className="dashboard-warning-text">⚠️ Latency increased more than 20% vs previous run — investigate regression</p>
            )}
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tickMargin={8} />
                  <YAxis
                    tickFormatter={selectedMetric === "Rate" ? (v: number) => `${(v * 100).toFixed(0)}%` : undefined}
                    domain={
                      selectedMetric === "Rate" ? [0, 0.6]
                      : selectedMetric === "Confidence" ? [50, 100]
                      : selectedMetric === "Reliability" ? [70, 100]
                      : undefined
                    }
                  />
                  <Tooltip content={<MetricDrillTooltip metric={selectedMetric} />} />
                  {selectedMetric === "Latency" && <CartesianGrid strokeDasharray="3 3" />}
                  {selectedMetric === "Latency" && (
                    <ReferenceArea y1={0} y2={LATENCY_EXPECTED} fill="rgba(34,197,94,0.08)" />
                  )}
                  {selectedMetric === "Latency" && (
                    <ReferenceArea y1={LATENCY_EXPECTED} y2={LATENCY_DEGRADED_THRESHOLD} fill="rgba(234,179,8,0.08)" />
                  )}
                  {selectedMetric === "Latency" && (
                    <ReferenceArea y1={LATENCY_DEGRADED_THRESHOLD} y2={12000} fill="rgba(239,68,68,0.08)" />
                  )}
                  {selectedMetric === "Latency" && (
                    <ReferenceLine
                      y={LATENCY_EXPECTED}
                      stroke="#22c55e"
                      strokeDasharray="5 3"
                      label={{ value: `Baseline ${LATENCY_EXPECTED} ms`, fill: "#22c55e", fontSize: 11, position: "insideTopLeft" }}
                    />
                  )}
                  {selectedMetric === "Latency" && <Line type="monotone" dataKey="latency" dot />}
                  {selectedMetric === "Confidence" && <CartesianGrid strokeDasharray="3 3" />}
                  {selectedMetric === "Confidence" && (
                    <ReferenceArea y1={CONFIDENCE_EXPECTED} y2={100} fill="rgba(34,197,94,0.08)" />
                  )}
                  {selectedMetric === "Confidence" && (
                    <ReferenceArea y1={CONFIDENCE_WARN_THRESHOLD} y2={CONFIDENCE_EXPECTED} fill="rgba(234,179,8,0.08)" />
                  )}
                  {selectedMetric === "Confidence" && (
                    <ReferenceArea y1={0} y2={CONFIDENCE_WARN_THRESHOLD} fill="rgba(239,68,68,0.08)" />
                  )}
                  {selectedMetric === "Confidence" && (
                    <ReferenceLine
                      y={CONFIDENCE_EXPECTED}
                      stroke="#22c55e"
                      strokeDasharray="5 3"
                      label={{ value: `Baseline ${CONFIDENCE_EXPECTED}`, fill: "#22c55e", fontSize: 11, position: "insideTopLeft" }}
                    />
                  )}
                  {selectedMetric === "Confidence" && <Line type="monotone" dataKey="confidence" dot />}
                  {selectedMetric === "Reliability" && <CartesianGrid strokeDasharray="3 3" />}
                  {selectedMetric === "Reliability" && (
                    <ReferenceArea y1={RELIABILITY_EXPECTED} y2={100} fill="rgba(34,197,94,0.08)" />
                  )}
                  {selectedMetric === "Reliability" && (
                    <ReferenceArea y1={RELIABILITY_WARN_THRESHOLD} y2={RELIABILITY_EXPECTED} fill="rgba(234,179,8,0.08)" />
                  )}
                  {selectedMetric === "Reliability" && (
                    <ReferenceArea y1={0} y2={RELIABILITY_WARN_THRESHOLD} fill="rgba(239,68,68,0.08)" />
                  )}
                  {selectedMetric === "Reliability" && (
                    <ReferenceLine
                      y={RELIABILITY_EXPECTED}
                      stroke="#22c55e"
                      strokeDasharray="5 3"
                      label={{ value: `Baseline ${RELIABILITY_EXPECTED}`, fill: "#22c55e", fontSize: 11, position: "insideTopLeft" }}
                    />
                  )}
                  {selectedMetric === "Reliability" && <Line type="monotone" dataKey="reliability" dot />}
                  {selectedMetric === "Rate" && <CartesianGrid strokeDasharray="3 3" />}
                  {selectedMetric === "Rate" && (
                    <ReferenceArea
                      y1={RATE_EXPECTED - 0.02}
                      y2={RATE_EXPECTED + 0.02}
                      fill="rgba(34,197,94,0.12)"
                    />
                  )}
                  {selectedMetric === "Rate" && (
                    <ReferenceLine
                      y={RATE_EXPECTED}
                      stroke="#22c55e"
                      strokeDasharray="5 3"
                      label={{ value: `Expected ${(RATE_EXPECTED * 100).toFixed(1)}%`, fill: "#22c55e", fontSize: 11, position: "insideTopLeft" }}
                    />
                  )}
                  {selectedMetric === "Rate" && (
                    <Line type="monotone" dataKey="rate" name="Enforcement Rate" stroke="var(--accent)" dot />
                  )}
                  {selectedMetric === "Rate" && <Legend />}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No trend data available yet. Run a CI pipeline to populate metrics.</p>
            )}
            <Insight metric={selectedMetric} run={selectedRun} previousRun={previous} recentRuns={last5} />
          </section>
        )}

        {/* ── Regression Impact ─────────────────────────────────────────────── */}
        {comparison && (
          <section className="dashboard-card" id={sectionId("Regression Impact vs Previous Run")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
              <h2 style={{ margin: 0 }}>Regression Impact (vs Previous Run)</h2>
              {runContext && (
                <button
                  type="button"
                  className="dashboard-scroll-top"
                  style={{ position: "static", width: 28, height: 28, fontSize: 14 }}
                  aria-label="Debug with AI"
                  title="Debug with AI"
                  onClick={() => {
                    setChatContext(
                      `Regression Impact snapshot:\n` +
                      `  Latency change: ${formatPercentFromRatio(comparison.latency_pct)}\n` +
                      `  Avg confidence change: ${formatPercentFromRatio(comparison.confidence_pct)}\n` +
                      `  Reliability delta: ${isFiniteNumber(comparison.reliability_delta) ? `${comparison.reliability_delta >= 0 ? "+" : ""}${formatFixed(comparison.reliability_delta, 1, " pts")}` : "N/A"}\n` +
                      `  Min confidence delta: ${isFiniteNumber(comparison.min_confidence_delta) ? `${comparison.min_confidence_delta >= 0 ? "+" : ""}${formatFixed(comparison.min_confidence_delta, 1, " pts")}` : "N/A"}`
                    );
                    setChatQuery("What does the regression impact show for this run? Identify likely root causes and what to investigate first.");
                  }}
                >
                  💬
                </button>
              )}
            </div>
            <p className="dashboard-section-desc">
              Side-by-side delta vs the prior run. Investigate immediately if latency is rising or
              confidence is dropping.
            </p>
            <section className="dashboard-row dashboard-row-3-col dashboard-row-header">
              <span>Metric</span>
              <span className="dashboard-col-center">Change</span>
              <span className="dashboard-col-right">Signal</span>
            </section>
            <section className="dashboard-row dashboard-row-3-col">
              <span>Latency</span>
              <span className="dashboard-col-center">{formatPercentFromRatio(comparison.latency_pct)}</span>
              <span className="dashboard-col-right">
                {getLatencyDeltaLabel(comparison.latency_pct)}
                {getDeltaStatus(comparison.latency_pct, "lower-is-better") && (
                  <span className={`dashboard-status-dot dashboard-status-${getDeltaStatus(comparison.latency_pct, "lower-is-better")}`} />
                )}
              </span>
            </section>
            <section className="dashboard-row dashboard-row-3-col">
              <span>Avg Confidence</span>
              <span className="dashboard-col-center">{formatPercentFromRatio(comparison.confidence_pct)}</span>
              <span className="dashboard-col-right">
                {getConfidenceDeltaLabel(comparison.confidence_pct)}
                {getDeltaStatus(comparison.confidence_pct, "higher-is-better") && (
                  <span className={`dashboard-status-dot dashboard-status-${getDeltaStatus(comparison.confidence_pct, "higher-is-better")}`} />
                )}
              </span>
            </section>
            <section className="dashboard-row dashboard-row-3-col">
              <span>Reliability</span>
              {/* reliability_delta is absolute points (e.g. 88→91 = +3 pts), NOT a ratio */}
              <span className="dashboard-col-center">
                {isFiniteNumber(comparison.reliability_delta)
                  ? `${comparison.reliability_delta >= 0 ? "+" : ""}${formatFixed(comparison.reliability_delta, 1, " pts")}`
                  : "N/A"}
              </span>
              <span className="dashboard-col-right">
                {isFiniteNumber(comparison.reliability_delta)
                  ? comparison.reliability_delta < 0
                    ? "Degradation"
                    : "Improvement"
                  : "No comparison data"}
                {getDeltaStatus(comparison.reliability_delta, "higher-is-better") && (
                  <span className={`dashboard-status-dot dashboard-status-${getDeltaStatus(comparison.reliability_delta, "higher-is-better")}`} />
                )}
              </span>
            </section>
            {isFiniteNumber(comparison.min_confidence_delta) && (
              <section className="dashboard-row dashboard-row-3-col">
                <span>Min Confidence</span>
                <span className="dashboard-col-center">
                  {`${comparison.min_confidence_delta >= 0 ? "+" : ""}${formatFixed(comparison.min_confidence_delta, 1, " pts")}`}
                </span>
                <span className="dashboard-col-right">
                  {comparison.min_confidence_delta < -5
                    ? "Edge-case regression"
                    : comparison.min_confidence_delta < 0
                      ? "Slight drop"
                      : "Stable or improved"}
                  <span className={`dashboard-status-dot dashboard-status-${comparison.min_confidence_delta < -5 ? "red" : comparison.min_confidence_delta < 0 ? "yellow" : "green"}`} />
                </span>
              </section>
            )}
          </section>
        )}

        {/* ── Performance Trends ────────────────────────────────────────────── */}
        <section className="dashboard-card" id={sectionId("System Trends")}>
          <h2>Performance Trends</h2>
          <p className="dashboard-section-desc">
            Historical view of latency, confidence, and reliability across the last 10 runs.
            Sustained downward trends indicate systemic regression risk.
          </p>
          {chartData.length > 0 ? (
            <LazyViewport minHeight={300} rootMargin="200px">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickMargin={8} label={{ value: "Run Date", position: "insideBottom", offset: -5 }} />
                  <YAxis width={60} />
                  <Tooltip content={<PerformanceTrendTooltip />} />
                  <Legend />
                  <Line type="monotone" name="Latency (ms)" dataKey="latency" />
                  <Line type="monotone" name="Confidence Score" dataKey="confidence" />
                  <Line type="monotone" name="Reliability Score" dataKey="reliability" />
                </LineChart>
              </ResponsiveContainer>
            </LazyViewport>
          ) : (
            <p>No performance data available yet. Run a CI pipeline to populate metrics.</p>
          )}
        </section>

        {/* ── Failure vs Latency Correlation ────────────────────────────────── */}
        <section className="dashboard-card" id={sectionId("Failure vs Latency Correlation")}>
          <h2>Failure vs Latency Correlation</h2>
          <p className="dashboard-section-desc">
            Shows whether system performance degradation is causing test failures. Correlated spikes
            may indicate infrastructure or backend issues.
          </p>
          {hasCorrelationData ? (
            <>
              {correlationInsight && (
                <p className={correlationInsight === "Possible system-induced failures" ? "dashboard-warning-text" : "dashboard-insight-text"}>
                  {correlationInsight === "Possible system-induced failures"
                    ? `⚠️ ${correlationInsight} — may impact users`
                    : `✓ ${correlationInsight}`}
                </p>
              )}
              <LazyViewport minHeight={280} rootMargin="200px">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickMargin={8} />
                    <YAxis yAxisId="left" label={{ value: "Latency (ms)", angle: -90, position: "insideLeft", offset: 1 }} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
                    <Tooltip content={<CorrelationTooltip />} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="latency" name="P95 Latency (ms)" stroke="var(--accent)" dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="failure_rate_pct" name="Failure Rate (%)" stroke="var(--warn)" dot={false} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </LazyViewport>
            </>
          ) : (
            <p>No correlation data available. Ensure test_runs are linked to regression runs.</p>
          )}
        </section>

        {/* ── Multilingual Retrieval Quality ────────────────────────────────── */}
        <section className="dashboard-card" id={sectionId("Multilingual Retrieval Intelligence")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
            <h2 style={{ margin: 0 }}>Multilingual Retrieval Quality</h2>
            {runContext && (
              <button
                type="button"
                className="dashboard-scroll-top"
                style={{ position: "static", width: 28, height: 28, fontSize: 14 }}
                aria-label="Debug with AI"
                title="Debug with AI"
                onClick={() => {
                  const langLines = sortedLanguages.map((l) => {
                    const drift = languageTrendMap.get(l.language);
                    return `  ${getLanguageName(l.language)}: avg=${formatFixed(l.avg_confidence, 1)}, min=${formatFixed(l.min_confidence, 1)}, Δ=${isFiniteNumber(drift) ? `${drift >= 0 ? "+" : ""}${drift.toFixed(1)}` : "N/A"}, risk=${getLanguageRisk(l)}${isUnstable(l) ? " (unstable)" : ""}`;
                  }).join("\n");
                  setChatContext(`Multilingual Retrieval Quality snapshot:\n${langLines}\nRetrieval stability: ${formatFixed(selectedRun.avg_rank_shift, 3)} avg rank shift`);
                  setChatQuery("Which languages are at risk and what might be causing low confidence scores for non-English queries?");
                }}
              >
                💬
              </button>
            )}
          </div>
          <p className="dashboard-section-desc">
            Measures retrieval quality across supported languages. Low confidence highlights
            potential user experience gaps for non-English speakers.
          </p>
          <h3>Current State</h3>
          {hasLanguageMetrics ? (
            <>
              <section className="dashboard-row dashboard-row-header dashboard-row-language" style={{ fontSize: "12px", opacity: 0.65 }}>
                <span>Language</span>
                <span className="dashboard-col-center">avg | min confidence</span>
                <span className="dashboard-col-center">Δ vs prev run</span>
                <span>Risk</span>
              </section>
              {sortedLanguages.map((language, i) => {
                const drift = languageTrendMap.get(language.language);
                return (
                  <section key={language.language ?? i} className="dashboard-row dashboard-row-language">
                    <span>{getLanguageName(language.language)}</span>
                    <span className="dashboard-col-center">
                      avg={formatFixed(language.avg_confidence, 1)} | min={formatFixed(language.min_confidence, 1)}
                    </span>
                    <span className="dashboard-col-center">
                      {isFiniteNumber(drift)
                        ? `${drift >= 0 ? "+" : ""}${drift.toFixed(1)}`
                        : "—"}
                    </span>
                    <span>
                      {getLanguageRisk(language)}{isUnstable(language) ? " — Unstable" : ""}
                      <span className={`dashboard-status-dot dashboard-status-${getLanguageConfidenceStatus(language.min_confidence) ?? "green"}`} />
                    </span>
                  </section>
                );
              })}
            </>
          ) : (
            <p>No language metrics available for this run.</p>
          )}

          {worstLanguage && (
            <>
              <h3>Highest Risk</h3>
              <p>
                <b>
                  {getLanguageName(worstLanguage.language)} — min {formatFixed(worstLanguage.min_confidence, 1)}
                </b>
              </p>
            </>
          )}

          <h3>Retrieval Stability</h3>
          <p>
            {formatFixed(selectedRun.avg_rank_shift, 3)} — <b>{getRankShiftLabel(selectedRun.avg_rank_shift)}</b>
          </p>
        </section>

        {/* ── Language Drift ────────────────────────────────────────────────── */}
        <section className="dashboard-card" id={sectionId("Language Drift")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
            <h2 style={{ margin: 0 }}>Language Drift</h2>
            {runContext && (
              <button
                type="button"
                className="dashboard-scroll-top"
                style={{ position: "static", width: 28, height: 28, fontSize: 14 }}
                aria-label="Debug with AI"
                title="Debug with AI"
                onClick={() => {
                  const driftLines = languageMetrics.map((l) => {
                    const delta = languageTrendMap.get(l.language) ?? null;
                    const label = !isFiniteNumber(delta) ? "No data" : delta < -10 ? "Regression" : delta < -3 ? "Drop" : delta > 3 ? "Improvement" : "Stable";
                    return `  ${getLanguageName(l.language)}: Δ=${isFiniteNumber(delta) ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}` : "N/A"} — ${label}`;
                  }).join("\n");
                  setChatContext(`Language Drift snapshot:\n${driftLines}`);
                  setChatQuery("Which languages are regressing the most and does it suggest an embedding, chunking, or data coverage issue?");
                }}
              >
                💬
              </button>
            )}
          </div>
          <p className="dashboard-section-desc">
            Per-language confidence shift relative to the previous run, sourced from historical
            retrieval data. Regressions in specific languages may point to embedding or chunking issues.
          </p>
          {hasLanguageMetrics ? (
            <>
              <section className="dashboard-row dashboard-row-3-col dashboard-row-header">
                <span>Language</span>
                <span className="dashboard-col-center">Delta</span>
                <span className="dashboard-col-right">Signal</span>
              </section>
              {languageMetrics.map((language, i) => {
                // Use actual per-language delta from retrieval_language_trend DB view
                const delta = languageTrendMap.get(language.language) ?? null;

                const label = !isFiniteNumber(delta)
                  ? "No drift data"
                  : delta < -10
                    ? "Regression"
                    : delta < -3
                      ? "Drop"
                      : delta > 3
                        ? "Improvement"
                        : "Stable";

                const driftStatus = getDriftStatus(label);

                return (
                  <section key={language.language ?? i} className="dashboard-row dashboard-row-3-col">
                    <span>{getLanguageName(language.language)}</span>
                    <span className="dashboard-col-center">
                      {isFiniteNumber(delta) ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}` : "—"}
                    </span>
                    <span className="dashboard-col-right">
                      {label}
                      {driftStatus && (
                        <span className={`dashboard-status-dot dashboard-status-${driftStatus}`} />
                      )}
                    </span>
                  </section>
                );
              })}
            </>
          ) : (
            <p>No drift data available for this run.</p>
          )}
        </section>

        {/* ── AI System Intelligence ────────────────────────────────────────── */}
        {story && (
          <section className="dashboard-card" id={sectionId("AI System Intelligence")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
              <h2 style={{ margin: 0 }}>AI System Intelligence</h2>
              {runContext && (
                <button
                  type="button"
                  className="dashboard-scroll-top"
                  style={{ position: "static", width: 28, height: 28, fontSize: 14 }}
                  aria-label="Debug with AI"
                  title="Debug with AI"
                  onClick={() => {
                    setChatContext(
                      `AI System Intelligence snapshot:\n` +
                      `  Severity: ${story.regression_severity}\n` +
                      `  Primary signal: ${story.primary_signal}\n` +
                      `  Trend direction: ${story.trend_direction}\n` +
                      `  User impact: ${story.user_impact}\n` +
                      `  Analysis confidence: ${story.analysis_confidence}`
                    );
                    setChatQuery("What does the current regression story tell us about system health and what should I do next?");
                  }}
                >
                  💬
                </button>
              )}
            </div>
            <p className="dashboard-section-desc">
              Automated narrative analysis of the current regression trend. Treat high-severity
              signals as a prompt to investigate the primary signal immediately.
            </p>
            <p>Trend: <b>{story.trend_direction}</b></p>
            <p>Severity: <b>{story.regression_severity}</b></p>
            <p>Primary Signal: <b>{story.primary_signal}</b></p>
            <p>User Impact: <b>{story.user_impact}</b></p>
            <p>Analysis Confidence: <b>{story.analysis_confidence}</b></p>
          </section>
        )}

        {/* ── Last 5 Runs (with CI linkback) ────────────────────────────────── */}
        <section className="dashboard-card" id={sectionId("Last 5 Runs Trend")}>
          <h2>Last 5 Runs Trend</h2>
          <p className="dashboard-section-desc">
            Recent run history for at-a-glance health comparison. Click a run to select it, then 💬 to ask the AI about it.
          </p>
          {last5.length > 0 ? (
            <>
              <section className="dashboard-row dashboard-row-header">
                <span>Date</span>
                <span>Latency (ms)</span>
                <span>Confidence</span>
                <span>Reliability</span>
              </section>
              {last5.map((run) => {
                const isSelected = run.run_id === selectedRun.run_id;
                return (
                  <section
                    key={run.run_id}
                    className="dashboard-row"
                    style={{
                      cursor: "pointer",
                      borderRadius: 6,
                      padding: "2px 4px",
                      background: isSelected ? "rgb(255 255 255 / 6%)" : undefined,
                      outline: isSelected ? "1px solid var(--soft)" : undefined,
                    }}
                    onClick={() => handleRunChange(run.run_id)}
                  >
                    <span>{new Date(run.run_timestamp).toLocaleDateString()}</span>
                    <span>{isFiniteNumber(run.p95_latency) ? `${run.p95_latency} ms` : "N/A"}</span>
                    <span>{formatFixed(run.avg_confidence, 2)}</span>
                    <span>{formatFixed(run.reliability_score, 2)}</span>
                  </section>
                );
              })}
            </>
          ) : (
            <p>No run history available yet.</p>
          )}
        </section>

        {/* ── Test Reliability — Flakiness aggregate ───────────────────────── */}
        <section className="dashboard-card" id={sectionId("Test Reliability - Flakiness")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
            <h2 style={{ margin: 0 }}>Test Suites Reliability</h2>
            {runContext && (
              <button
                type="button"
                className="dashboard-scroll-top"
                style={{ position: "static", width: 28, height: 28, fontSize: 14 }}
                aria-label="Debug with AI"
                title="Debug with AI"
                onClick={() => {
                  const workflowLines = e2eStability.length > 0
                    ? e2eStability.map((w) =>
                        `  • ${w.workflow_type === "pr_e2e" ? "PR E2E" : w.workflow_type === "deploy_e2e" ? "Deploy E2E" : w.workflow_type}: ` +
                        `current=${formatPercentFromWhole(w.avg_flakiness_pct)}, ` +
                        `prev=${isFiniteNumber(w.prev_flakiness_pct) ? formatPercentFromWhole(w.prev_flakiness_pct) : "N/A"}, ` +
                        `delta=${isFiniteNumber(w.flakiness_delta) ? `${w.flakiness_delta >= 0 ? "+" : ""}${w.flakiness_delta.toFixed(2)}%` : "N/A"}, ` +
                        `trend=${w.trend_direction}`
                      ).join("\n")
                    : "  No E2E workflow data available.";
                  const topFlaky = flakyTests.slice(0, 5).map((t) =>
                    `  • ${t.test_name ?? "unknown"}: ${formatPercentFromWhole(t.flakiness_pct)} flaky (${t.severity ?? "?"} severity, ${t.recency ?? "?"})`
                  ).join("\n") || "  No individual flaky tests recorded.";
                  setChatContext(
                    `Test Suite Reliability snapshot:\n` +
                    `Overall flakiness: ${formatPercentFromWhole(effectiveFlakinessPct)} — ${getFlakinessRisk(effectiveFlakinessPct)}\n` +
                    `Change vs previous run: ${isFiniteNumber(flakinessDelta) ? `${flakinessDelta > 0 ? "+" : ""}${flakinessDelta.toFixed(2)}%` : "not enough data"}\n\n` +
                    `E2E Workflow Breakdown:\n${workflowLines}\n\n` +
                    `Top Flaky Tests:\n${topFlaky}`
                  );
                  setChatQuery("Analyze test suite stability and identify the biggest concerns across workflows and individual tests.");
                }}
              >
                💬
              </button>
            )}
          </div>
          <p className="dashboard-section-desc">
            Tracks test instability over time across CI workflows. High flakiness reduces
            confidence in results and may mask real regressions.
          </p>

          {!flakiness && flakinessTrend.length === 0 ? (
            <p>No flakiness data available yet. Run tests to populate reliability metrics.</p>
          ) : (
            <>
              <h3>Current State</h3>
              <p>
                Flakiness:{" "}
                <b>{formatPercentFromWhole(effectiveFlakinessPct)}</b>
                {" — "}
                <b>{getFlakinessRisk(effectiveFlakinessPct)}</b>
                {isFiniteNumber(effectiveFlakinessPct) && (
                  <span
                    className={`dashboard-status-dot dashboard-status-${getStatusColor(effectiveFlakinessPct, "flakiness") ?? "green"}`}
                  />
                )}
              </p>

              <h3>Change vs Previous Run</h3>
              <p>
                {isFiniteNumber(flakinessDelta)
                  ? `${flakinessDelta > 0 ? "+" : ""}${flakinessDelta.toFixed(2)} → ${
                      flakinessDelta > 1
                        ? "Regression ↓ investigate regression"
                        : flakinessDelta < -1
                        ? "Improvement ↑ improving trend"
                        : "Stable"
                    }`
                  : "Not enough historical data"}
              </p>

              {e2eStability.length > 0 && (
                <>
                  <h3>Workflow Breakdown</h3>
                  <p className="dashboard-section-desc" style={{ marginBottom: "8px" }}>
                    Per-workflow flakiness for E2E suites — reflects instability across browser pipelines.
                  </p>
                  <section className="dashboard-row dashboard-row-header dashboard-row-flaky" style={{ fontSize: "12px", opacity: 0.65 }}>
                    <span>Workflow</span>
                    <span className="dashboard-col-center">Current</span>
                    <span className="dashboard-col-center">Prev</span>
                    <span className="dashboard-col-center">Δ</span>
                    <span className="dashboard-col-center">Trend</span>
                  </section>
                  {e2eStability.map((w) => (
                    <section key={w.workflow_type} className="dashboard-row dashboard-row-flaky">
                      <span>{w.workflow_type === "pr_e2e" ? "PR E2E" : w.workflow_type === "deploy_e2e" ? "Deploy E2E" : w.workflow_type}</span>
                      <span className="dashboard-col-center">{formatPercentFromWhole(w.avg_flakiness_pct)}</span>
                      <span className="dashboard-col-center">{isFiniteNumber(w.prev_flakiness_pct) ? formatPercentFromWhole(w.prev_flakiness_pct) : "—"}</span>
                      <span className="dashboard-col-center">
                        {isFiniteNumber(w.flakiness_delta)
                          ? `${w.flakiness_delta >= 0 ? "+" : ""}${w.flakiness_delta.toFixed(2)}`
                          : "—"}
                      </span>
                      <span className="dashboard-col-center">
                        {w.trend_direction}
                        <span className={`dashboard-status-dot dashboard-status-${w.trend_direction === "improving" ? "green" : w.trend_direction === "degrading" ? "red" : "yellow"}`} />
                      </span>
                    </section>
                  ))}
                </>
              )}

              <h3>Historical Trend — E2E Workflows</h3>
              <p className="dashboard-section-desc" style={{ marginBottom: "8px" }}>
                Failure rate (%) over time for each CI workflow pipeline.
              </p>
              {e2eDualChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={e2eDualChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickMargin={8} height={50} tick={<TwoLineTick />} />
                    <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
                    <Tooltip content={<E2eWorkflowTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="pr_e2e"
                      name="PR E2E"
                      stroke="var(--accent, #6366f1)"
                      strokeWidth={2}
                      dot
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="deploy_e2e"
                      name="Deploy E2E"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : flakinessChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={flakinessChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickMargin={8} height={50} tick={<TwoLineTick />} />
                    <YAxis />
                    <Tooltip content={<FlakinessTooltip />} />
                    <Line type="monotone" dataKey="flakiness" name="Flakiness %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p>No historical flakiness data available.</p>
              )}
            </>
          )}
        </section>

        {/* ── Flaky Tests Breakdown ─────────────────────────────────────────── */}
        <section className="dashboard-card" id={sectionId("Flaky Tests Breakdown")}>
          <h2>Flaky Tests Breakdown</h2>
          <p className="dashboard-section-desc">
            Top flaky tests ranked by instability rate. High-severity tests with recent recency
            indicate active reliability problems — prioritize these for investigation.
          </p>

          {flakyTests.length === 0 ? (
            <p>No flaky tests detected. All tests are currently stable.</p>
          ) : (
            <>
              <section className="dashboard-row dashboard-row-header dashboard-row-flaky">
                <span>Test Name</span>
                <span className="dashboard-col-center">Flakiness %</span>
                <span className="dashboard-col-center">Flaky / Total</span>
                <span className="dashboard-col-center">Severity</span>
                <span className="dashboard-col-center">Recency</span>
              </section>
              {flakyTests.map((test, i) => (
                <section key={test.test_name ?? i} className="dashboard-row dashboard-row-flaky">
                  <span className="dashboard-test-name" title={test.test_name}>
                    {test.test_name}
                  </span>
                  <span className="dashboard-col-center">{formatPercentFromWhole(test.flakiness_pct)}</span>
                  <span className="dashboard-col-center">
                    {isFiniteNumber(test.flaky_runs) && isFiniteNumber(test.total_runs)
                      ? `${test.flaky_runs} / ${test.total_runs}`
                      : "N/A"}
                  </span>
                  <span className={`dashboard-col-center ${getSeverityClass(test.severity)}`}>
                    {test.severity ?? "—"}
                  </span>
                  <span className="dashboard-col-center">{test.recency ?? "—"}</span>
                </section>
              ))}
            </>
          )}
        </section>

        {/* ── System Risk Assessment ────────────────────────────────────────── */}
        <section className="dashboard-card" id={sectionId("AI Risk Summary")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
            <h2 style={{ margin: 0 }}>System Risk Assessment</h2>
            {runContext && (
              <button
                type="button"
                className="dashboard-scroll-top"
                style={{ position: "static", width: 28, height: 28, fontSize: 14 }}
                aria-label="Debug with AI"
                title="Debug with AI"
                onClick={() => {
                  setChatContext(
                    `System Risk Assessment snapshot:\n` +
                    `  Regression severity: ${story?.regression_severity ?? "unknown"}\n` +
                    `  Primary signal: ${story?.primary_signal ?? "none"}\n` +
                    `  User impact: ${story?.user_impact ?? "unknown"}\n` +
                    `  Analysis confidence: ${story?.analysis_confidence ?? "unknown"}\n` +
                    `  Trend direction: ${story?.trend_direction ?? "unknown"}`
                  );
                  setChatQuery("What does the system risk assessment mean for end users and what should I prioritize?");
                }}
              >
                💬
              </button>
            )}
          </div>
          <p className="dashboard-section-desc">
            Aggregated risk summary across retrieval quality, test stability, and regression signals.
            Immediate action recommended when severity is critical or user impact is detected.
          </p>

          {story && (
            <>
              <section className="dashboard-row dashboard-row-2-col dashboard-row-header" style={{ marginBottom: "4px" }}>
                <span>Metric</span>
                <span className="dashboard-col-right">Signal</span>
              </section>
              <section className="dashboard-row dashboard-row-2-col" style={{ marginBottom: "4px" }}>
                <span>Regression Severity</span>
                <span className="dashboard-col-right">
                  <b style={{ textTransform: "capitalize" }}>{story.regression_severity}</b>
                  <span className={`dashboard-status-dot dashboard-status-${story.regression_severity === "critical" ? "red" : story.regression_severity === "moderate" ? "orange" : story.regression_severity === "minor" ? "yellow" : "green"}`} />
                </span>
              </section>
              <section className="dashboard-row dashboard-row-2-col" style={{ marginBottom: "4px" }}>
                <span>User Impact</span>
                <span className="dashboard-col-right">
                  <b>{getUserImpactLabel(story.user_impact).label}</b>
                  {getUserImpactLabel(story.user_impact).status && (
                    <span className={`dashboard-status-dot dashboard-status-${getUserImpactLabel(story.user_impact).status}`} />
                  )}
                </span>
              </section>
              <section className="dashboard-row dashboard-row-2-col" style={{ marginBottom: "4px" }}>
                <span>Primary Signal</span>
                <span className="dashboard-col-right">
                  <b>{getPrimarySignalLabel(story.primary_signal)}</b>
                </span>
              </section>
              <section className="dashboard-row dashboard-row-2-col" style={{ marginBottom: "4px" }}>
                <span>Analysis Confidence</span>
                <span className="dashboard-col-right">
                  <b style={{ textTransform: "capitalize" }}>{story.analysis_confidence}</b>
                  <span className={`dashboard-status-dot dashboard-status-${story.analysis_confidence === "high" ? "green" : story.analysis_confidence === "medium" ? "yellow" : "orange"}`} />
                </span>
              </section>
            </>
          )}

          <section className="dashboard-row dashboard-row-2-col" style={{ marginTop: story ? "12px" : undefined }}>
            <span>Worst-case Confidence</span>
            <span className="dashboard-col-right">
              <b>{worstLanguage ? `${formatFixed(worstLanguage.min_confidence, 1)} (${getLanguageName(worstLanguage.language)})` : "N/A"}</b>
              {worstLanguage && (
                <span className={`dashboard-status-dot dashboard-status-${getLanguageConfidenceStatus(worstLanguage.min_confidence) ?? "green"}`} />
              )}
            </span>
          </section>
          <section className="dashboard-row dashboard-row-2-col">
            <span>Retrieval Stability</span>
            <span className="dashboard-col-right">
              <b>
                {languageMetrics.some(isUnstable)
                  ? "Retrieval instability detected"
                  : isFiniteNumber(effectiveFlakinessPct) && effectiveFlakinessPct > 2
                    ? "Test instability (flaky suite)"
                    : "Stable system"}
              </b>
              <span className={`dashboard-status-dot dashboard-status-${languageMetrics.some(isUnstable) || (isFiniteNumber(effectiveFlakinessPct) && effectiveFlakinessPct > 2) ? "red" : "green"}`} />
            </span>
          </section>
        </section>
        <div style={{ height: "2rem" }} aria-hidden="true" />
      </main>

      <ChatWidget
        disableBackdrop
        runContext={runContext}
        greeting={chatGreeting}
        externalQuery={chatQuery}
        onExternalQueryConsumed={() => setChatQuery(undefined)}
        externalContext={chatContext}
        onExternalContextConsumed={() => setChatContext(undefined)}
        conversationKey={selectedRun.run_id}
        pageSource="dashboard"
      />
      {showScrollTop && (
        <button
          type="button"
          className="dashboard-scroll-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
        >
          <svg width="16" height="20" viewBox="0 0 24 24">
            <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Metric({ title, value, subtitle, status, onClick, onAskAI }: MetricProps) {
  const valueColorClass = status ? `dashboard-metric-value-${status}` : "";
  return (
    <div style={{ position: "relative" }}>
      <button type="button" className="dashboard-metric" onClick={onClick}>
        <div>{title}</div>
        <div className={`dashboard-metric-value${valueColorClass ? ` ${valueColorClass}` : ""}`}>
          {value}
          {status && <span className={`dashboard-status-dot dashboard-status-${status}`} />}
        </div>
        {subtitle && <div className="dashboard-metric-subtitle">{subtitle}</div>}
      </button>
      {onAskAI && (
        <button
          type="button"
          className="dashboard-scroll-top"
          style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, fontSize: 12 }}
          aria-label={`Ask AI about ${title}`}
          title={`Ask AI about ${title}`}
          onClick={(e) => { e.stopPropagation(); onAskAI(); }}
        >
          💬
        </button>
      )}
    </div>
  );
}

function Insight({ metric, run, previousRun, recentRuns }: InsightProps) {
  if (metric === "Rate") {
    const dev = getRateLimitSeverity(run?.enforcement_rate);
    const desc = (
      <>
        Validates rate limit enforcement accuracy.
        <br />
        Deviations from expected behavior may indicate incorrect throttling or user impact.
        <br />
        
      </>
    );
    
    if (!dev) return <p className="dashboard-insight-text">{desc}</p>;
    const blocked = Math.round((run?.enforcement_rate ?? 0) * RATE_TOTAL_REQUESTS);
    const sign = dev.delta >= 0 ? "+" : "";
    return (
      <p className="dashboard-insight-text">
        {desc}{" "}
        Current enforcement is <b>{dev.label}</b> — {sign}{(dev.delta * 100).toFixed(1)}% vs {(RATE_EXPECTED * 100).toFixed(1)}% baseline ({blocked}/{RATE_TOTAL_REQUESTS} requests blocked).
      </p>
    );
  }
  if (metric === "Latency") {
    const actual = run?.p95_latency;
    const prev = previousRun?.p95_latency;
    if (!isFiniteNumber(actual)) {
      return <p className="dashboard-insight-text">No latency data available.</p>;
    }
    const dev = getLatencyDeviationStatus(actual);
    if (!dev) return <p className="dashboard-insight-text">No latency data available.</p>;

    // Degraded range override takes priority
    if (actual > LATENCY_DEGRADED_THRESHOLD) {
      return (
        <p className="dashboard-insight-text dashboard-warning-text">
          ⚠️ Latency entering degraded range — may impact response quality
        </p>
      );
    }

    // No previous run
    if (!isFiniteNumber(prev)) {
      return <p className="dashboard-insight-text">Latency within expected baseline.</p>;
    }

    const trendPct = (actual - prev) / prev;
    let message: string;
    if (trendPct > 0.15) {
      message = "🚨 Significant latency regression — investigate backend or model performance";
    } else if (trendPct > 0.05) {
      message = `⚠️ Latency increasing — early regression signal (+${(trendPct * 100).toFixed(1)}% vs previous run)`;
    } else if (trendPct <= 0) {
      message = "Latency improving — system performance trending positively";
    } else {
      message = `Latency stable and within expected performance range (+${(trendPct * 100).toFixed(1)}% vs previous run)`;
    }
    return <p className="dashboard-insight-text">{message}</p>;
  }
  if (metric === "Confidence") {
    const actual = run?.avg_confidence;
    const prev = previousRun?.avg_confidence;
    if (!isFiniteNumber(actual)) {
      return <p className="dashboard-insight-text">No confidence data available.</p>;
    }
    if (!isFiniteNumber(prev)) {
      return <p className="dashboard-insight-text">Confidence within expected baseline.</p>;
    }
    const trendPct = (actual - prev) / prev;
    let message: string;
    if (trendPct > 0.05) {
      message = `Confidence improving — retrieval quality increasing (+${(trendPct * 100).toFixed(1)}% vs previous run)`;
    } else if (trendPct > 0) {
      message = `Stable confidence (+${(trendPct * 100).toFixed(1)}% vs previous run)`;
    } else if (trendPct < -0.10) {
      message = `🚨 Significant confidence drop (${(trendPct * 100).toFixed(1)}%) — likely retrieval regression`;
    } else if (trendPct < -0.05) {
      message = `⚠️ Confidence decreasing (${(trendPct * 100).toFixed(1)}%) — early quality degradation`;
    } else {
      message = `Minor variation within expected range (${(trendPct * 100).toFixed(1)}% vs previous run)`;
    }
    return <p className="dashboard-insight-text">{message}</p>;
  }
  if (metric === "Reliability") {
    const actual = run?.reliability_score;
    const prev = previousRun?.reliability_score;
    if (!isFiniteNumber(actual)) {
      return <p className="dashboard-insight-text">No reliability data available.</p>;
    }
    // Detect consistent downward trend across last 3+ runs
    const isDownwardTrend =
      Array.isArray(recentRuns) &&
      recentRuns.length >= 3 &&
      recentRuns
        .slice(0, 3)
        .every((r, i, arr) =>
          i === 0 || (isFiniteNumber(r.reliability_score) && isFiniteNumber(arr[i - 1].reliability_score) && r.reliability_score < arr[i - 1].reliability_score)
        );
    if (isDownwardTrend) {
      return (
        <p className="dashboard-insight-text dashboard-warning-text">
          ⚠️ Reliability trending downward across runs — investigate latency and retrieval performance
        </p>
      );
    }
    if (!isFiniteNumber(prev)) {
      return <p className="dashboard-insight-text">Reliability aligned with expected baseline.</p>;
    }
    const trendPct = (actual - prev) / prev;
    let message: string;
    if (trendPct > 0) {
      message = `Reliability improving — system stability trending positively (+${(trendPct * 100).toFixed(1)}% vs previous run)`;
    } else if (trendPct < -0.05) {
      message = `🚨 Reliability dropping (${(trendPct * 100).toFixed(1)}%) — system stability degrading`;
    } else if (trendPct < -0.02) {
      message = `⚠️ Reliability decreasing (${(trendPct * 100).toFixed(1)}%) — early degradation signal`;
    } else {
      message = `Minor variation within expected range (${(trendPct * 100).toFixed(1)}% vs previous run)`;
    }
    return <p className="dashboard-insight-text">{message}</p>;
  }
  return null;
}

type TooltipPayloadEntry = {
  name: string;
  value: number;
  color?: string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
};

function TooltipShell({ label, children, footer }: { label?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="dashboard-trend-tooltip">
      {label && <div className="dashboard-trend-tooltip-label">{label}</div>}
      {children}
      {footer && <div className="dashboard-trend-tooltip-total">{footer}</div>}
    </div>
  );
}

function PerformanceTrendTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const latency = payload.find((p) => p.name === "Latency (ms)")?.value;
  const confidence = payload.find((p) => p.name === "Confidence Score")?.value;
  const reliability = payload.find((p) => p.name === "Reliability Score")?.value;
  const total =
    isFiniteNumber(latency) && isFiniteNumber(confidence) && isFiniteNumber(reliability)
      ? latency + confidence + reliability
      : null;
  return (
    <TooltipShell
      label={label}
      footer={isFiniteNumber(total) ? <>Total: <b>{total.toFixed(1)}</b></> : undefined}
    >
      {isFiniteNumber(confidence) && <div>Confidence Score: <b>{confidence.toFixed(1)}</b></div>}
      {isFiniteNumber(latency) && <div>Latency: <b>{latency} ms</b></div>}
      {isFiniteNumber(reliability) && <div>Reliability Score: <b>{reliability.toFixed(1)}</b></div>}
    </TooltipShell>
  );
}

function MetricDrillTooltip({ active, payload, label, metric }: ChartTooltipProps & { metric: MetricKey | null }) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  if (!isFiniteNumber(entry?.value)) return null;
  let display: string;
  if (metric === "Rate") display = `${(entry.value * 100).toFixed(1)}%`;
  else if (metric === "Latency") display = `${entry.value} ms`;
  else display = entry.value.toFixed(1);
  return (
    <TooltipShell label={label}>
      <div>{entry.name}: <b>{display}</b></div>
    </TooltipShell>
  );
}

function CorrelationTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const latency = payload.find((p) => p.name === "P95 Latency (ms)")?.value;
  const failureRate = payload.find((p) => p.name === "Failure Rate (%)")?.value;
  return (
    <TooltipShell label={label}>
      {isFiniteNumber(latency) && <div>P95 Latency: <b>{latency} ms</b></div>}
      {isFiniteNumber(failureRate) && <div>Failure Rate: <b>{failureRate.toFixed(1)}%</b></div>}
    </TooltipShell>
  );
}

function FlakinessTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0]?.value;
  return (
    <TooltipShell label={label}>
      {isFiniteNumber(value) && <div>Flakiness: <b>{value.toFixed(2)}%</b></div>}
    </TooltipShell>
  );
}

function E2eWorkflowTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <TooltipShell label={label}>
      {payload.map((entry) => {
        const v = entry.value;
        if (!isFiniteNumber(v)) return null;
        return (
          <div key={entry.name} style={{ color: entry.color }}>
            {entry.name}: <b>{v.toFixed(1)}%</b>
          </div>
        );
      })}
    </TooltipShell>
  );
}

function TwoLineTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  if (!payload?.value) return null;
  const parts = payload.value.split(", ");
  const datePart = parts[0] ?? payload.value;
  const timePart = parts[1] ?? "";
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={11} fill="#888">
        {datePart}
      </text>
      {timePart && (
        <text x={0} y={0} dy={26} textAnchor="middle" fontSize={11} fill="#888">
          {timePart}
        </text>
      )}
    </g>
  );
}

function LazyViewport({ children, minHeight, rootMargin = "160px" }: LazyViewportProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={containerRef} className="dashboard-lazy-container" style={{ minHeight }}>
      {isVisible ? (
        <div className="dashboard-lazy-fade">{children}</div>
      ) : (
        <div className="dashboard-lazy-placeholder" aria-hidden="true" />
      )}
    </div>
  );
}
