import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { HeaderDashboard } from "../components/HeaderDashboard";
import "../styles/Dashboard.css";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Domain types ────────────────────────────────────────────────────────────

type MetricKey = "Latency" | "Reliability" | "Confidence" | "Rate";
type SlaStatus = "green" | "yellow" | "red" | null;
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
  subtitle?: string;
  status?: SlaStatus;
  onClick: () => void;
};

type InsightProps = {
  metric: MetricKey;
};

type LazyViewportProps = {
  children: ReactNode;
  minHeight: number;
  rootMargin?: string;
};

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

function getSeverityClass(severity: string | null | undefined): string {
  if (severity === "high") return "dashboard-severity-high";
  if (severity === "medium") return "dashboard-severity-medium";
  return "dashboard-severity-low";
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

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
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);

  // ── Regression comparison ───────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabaseConfig) return;

    fetch(`${supabaseUrl}/rest/v1/regression_run_comparison?order=run_timestamp.desc&limit=1`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Comparison API error");
        return res.json();
      })
      .then((data) => setComparison(data?.[0] ?? null))
      .catch((err) => console.error("Comparison fetch error:", err));
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  // ── Regression story ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabaseConfig) return;

    fetch(`${supabaseUrl}/rest/v1/regression_story?order=run_timestamp.desc&limit=1`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Story API error");
        return res.json();
      })
      .then((data) => setStory(data?.[0] ?? null))
      .catch((err) => console.error("Story fetch error:", err));
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  // ── Runs — single fetch; trend derived via slice ────────────────────────────
  useEffect(() => {
    if (!hasSupabaseConfig) return;

    fetch(`${supabaseUrl}/rest/v1/regression_run_summary?order=run_timestamp.desc`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Runs API error");
        return res.json();
      })
      .then((data) => {
        const normalized = Array.isArray(data) ? data : [];
        setRuns(normalized);
        setTrend(normalized.slice(0, 10));
        if (normalized.length > 0) setSelectedRun(normalized[0]);
      })
      .catch((err) => console.error("Runs fetch error:", err))
      .finally(() => setIsLoadingRuns(false));
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  // ── Language metrics (per selected run) ────────────────────────────────────
  useEffect(() => {
    if (!hasSupabaseConfig || !selectedRun) return;

    const safeRunId = encodeURIComponent(selectedRun.run_id);
    fetch(`${supabaseUrl}/rest/v1/retrieval_language_summary?run_id=eq.${safeRunId}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Language summary fetch error");
        return res.json();
      })
      .then((data) => setLanguageMetrics(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Language metrics error:", err));
  }, [selectedRun, hasSupabaseConfig, supabaseKey, supabaseUrl]);

  // ── Flakiness (per selected run) ───────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabaseConfig || !selectedRun) return;

    const safeRunId = encodeURIComponent(selectedRun.run_id);
    fetch(`${supabaseUrl}/rest/v1/flakiness_run_summary?run_id=eq.${safeRunId}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Flakiness fetch error");
        return res.json();
      })
      .then((data) => setFlakiness(Array.isArray(data) ? (data[0] ?? null) : null))
      .catch((err) => console.error("Flakiness error:", err));
  }, [selectedRun, hasSupabaseConfig, supabaseKey, supabaseUrl]);

  // ── Flakiness trend (global) ────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabaseConfig) return;

    fetch(`${supabaseUrl}/rest/v1/flakiness_trend?order=run_timestamp.desc&limit=10`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Flakiness trend fetch error");
        return res.json();
      })
      .then((data) => setFlakinessTrend(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Flakiness trend error:", err));
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  // ── Per-test flakiness breakdown ───────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabaseConfig) return;

    fetch(`${supabaseUrl}/rest/v1/test_flakiness_enriched?order=flakiness_pct.desc&limit=15`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Flaky tests fetch error");
        return res.json();
      })
      .then((data) => setFlakyTests(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Flaky tests error:", err));
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  // ── Test runs — for failure correlation + CI linkback ──────────────────────
  useEffect(() => {
    if (!hasSupabaseConfig) return;

    fetch(`${supabaseUrl}/rest/v1/test_runs?order=run_timestamp.desc&limit=10`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Test runs fetch error");
        return res.json();
      })
      .then((data) => setTestRuns(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Test runs error:", err));
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  // ── Derived flakiness values ────────────────────────────────────────────────
  const hasFlakinessTrend = flakinessTrend.length > 0;
  const latestFlaky = hasFlakinessTrend ? flakinessTrend[0]?.flakiness_pct : null;
  const prevFlaky = flakinessTrend.length > 1 ? flakinessTrend[1]?.flakiness_pct : null;
  const flakinessDelta =
    isFiniteNumber(latestFlaky) && isFiniteNumber(prevFlaky) ? latestFlaky - prevFlaky : null;

  const flakinessChartData =
    flakinessTrend.length > 0
      ? [...flakinessTrend]
          .sort((a, b) => new Date(a.run_timestamp).getTime() - new Date(b.run_timestamp).getTime())
          .map((entry) => ({
            date: new Date(entry.run_timestamp).toLocaleDateString(),
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
  const getRateLimitLabel = (rate: number | null | undefined) => {
    if (!isFiniteNumber(rate)) return "No rate-limit data";
    if (rate < 0.1) return "Low impact";
    if (rate < 0.3) return "Moderate throttling";
    return "High user impact";
  };

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
    return <section className="dashboard-page">Loading dashboard…</section>;
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
    date: new Date(entry.run_timestamp).toLocaleDateString(),
    latency: entry.p95_latency,
    confidence: entry.min_confidence,
    reliability: entry.reliability_score,
    rate: entry.enforcement_rate,
  }));

  // ── Failure correlation data ────────────────────────────────────────────────
  const testRunMap = new Map<string, TestRun>(
    testRuns.map((tr) => [String(tr.id), tr])
  );

  const correlationData = chronologicalTrend.map((entry) => {
    const tr = testRunMap.get(entry.run_id);
    const failure_rate_pct =
      tr && isFiniteNumber(tr.failed) && isFiniteNumber(tr.total_tests) && tr.total_tests > 0
        ? (tr.failed / tr.total_tests) * 100
        : null;
    return {
      date: new Date(entry.run_timestamp).toLocaleDateString(),
      latency: entry.p95_latency,
      failure_rate_pct,
    };
  });

  const hasCorrelationData = correlationData.some(
    (d) => isFiniteNumber(d.latency) && isFiniteNumber(d.failure_rate_pct)
  );

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

        {/* ── Run Selector ──────────────────────────────────────────────────── */}
        <section className="dashboard-card" id={sectionId("Run Selector")}>
          <h2>Select Evaluation Run</h2>
          <p className="dashboard-section-desc">
            Choose a CI pipeline run to inspect. Each run reflects a full automated test suite
            execution and AI regression analysis.
          </p>
          <label htmlFor="run-selector">Select Run:</label>
          <select
            id="run-selector"
            className="dashboard-select"
            onChange={(e) => handleRunChange(e.target.value)}
          >
            {runs.map((run) => (
              <option key={run.run_id} value={run.run_id}>
                Run {run.run_id} — {new Date(run.run_timestamp).toLocaleString()}
              </option>
            ))}
          </select>
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
              status={getStatusColor(selectedRun.p95_latency, "latency")}
              onClick={() => setSelectedMetric("Latency")}
            />
            <Metric
              title="Reliability"
              value={formatPercentFromWhole(selectedRun.reliability_score)}
              status={getStatusColor(selectedRun.reliability_score, "reliability")}
              onClick={() => setSelectedMetric("Reliability")}
            />
            <Metric
              title="Confidence"
              value={formatPercentFromWhole(selectedRun.avg_confidence)}
              status={getStatusColor(selectedRun.avg_confidence, "confidence")}
              onClick={() => setSelectedMetric("Confidence")}
            />
            <Metric
              title="Rate Limit"
              value={formatPercentFromRatio(selectedRun.enforcement_rate)}
              subtitle={getRateLimitLabel(selectedRun.enforcement_rate)}
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
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  {selectedMetric === "Latency" && <Line type="monotone" dataKey="latency" />}
                  {selectedMetric === "Confidence" && <Line type="monotone" dataKey="confidence" />}
                  {selectedMetric === "Reliability" && <Line type="monotone" dataKey="reliability" />}
                  {selectedMetric === "Rate" && <Line type="monotone" dataKey="rate" />}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No trend data available yet. Run a CI pipeline to populate metrics.</p>
            )}
            <Insight metric={selectedMetric} />
          </section>
        )}

        {/* ── Regression Impact ─────────────────────────────────────────────── */}
        {comparison && (
          <section className="dashboard-card" id={sectionId("Regression Impact vs Previous Run")}>
            <h2>Regression Impact (vs Previous Run)</h2>
            <p className="dashboard-section-desc">
              Side-by-side delta vs the prior run. Investigate immediately if latency is rising or
              confidence is dropping.
            </p>
            <section className="dashboard-row dashboard-row--3col">
              <span>Latency</span>
              <span className="dashboard-col-center">{formatPercentFromRatio(comparison.latency_pct)}</span>
              <span className="dashboard-col-right">
                {getLatencyDeltaLabel(comparison.latency_pct)}
                {getDeltaStatus(comparison.latency_pct, "lower-is-better") && (
                  <span className={`dashboard-status-dot dashboard-status-${getDeltaStatus(comparison.latency_pct, "lower-is-better")}`} />
                )}
              </span>
            </section>
            <section className="dashboard-row dashboard-row--3col">
              <span>Confidence</span>
              <span className="dashboard-col-center">{formatPercentFromRatio(comparison.confidence_pct)}</span>
              <span className="dashboard-col-right">
                {getConfidenceDeltaLabel(comparison.confidence_pct)}
                {getDeltaStatus(comparison.confidence_pct, "higher-is-better") && (
                  <span className={`dashboard-status-dot dashboard-status-${getDeltaStatus(comparison.confidence_pct, "higher-is-better")}`} />
                )}
              </span>
            </section>
            <section className="dashboard-row dashboard-row--3col">
              <span>Reliability</span>
              <span className="dashboard-col-center">{formatPercentFromRatio(comparison.reliability_delta)}</span>
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
                  <XAxis dataKey="date" label={{ value: "Run Date", position: "insideBottom", offset: -5 }} />
                  <YAxis label={{ value: "Metrics", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
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
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" label={{ value: "Latency (ms)", angle: -90, position: "insideLeft", offset: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v: number) => `${v.toFixed(1)}%`} />
                    <Tooltip />
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
          <h2>Multilingual Retrieval Quality</h2>
          <p className="dashboard-section-desc">
            Measures retrieval quality across supported languages. Low confidence highlights
            potential user experience gaps for non-English speakers.
          </p>
          <h3>Current State</h3>
          {hasLanguageMetrics ? (
            sortedLanguages.map((language, i) => (
              <section key={language.language ?? i} className="dashboard-row">
                <span>{getLanguageName(language.language)}</span>
                <span>
                  avg={formatFixed(language.avg_confidence, 1)} | min={formatFixed(language.min_confidence, 1)}
                </span>
                <span>
                  {getLanguageRisk(language)} {isUnstable(language) ? "— Unstable" : ""}
                  <span className={`dashboard-status-dot dashboard-status-${getLanguageConfidenceStatus(language.min_confidence) ?? "green"}`} />
                </span>
              </section>
            ))
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
        <section className="dashboard-card" id={sectionId("Language Drift Approx")}>
          <h2>Language Drift (Approx)</h2>
          <p className="dashboard-section-desc">
            Per-language confidence shift relative to the previous run. Regressions in specific
            languages may point to embedding or chunking issues.
          </p>
          {hasLanguageMetrics ? (
            languageMetrics.map((language, i) => {
              const delta =
                isFiniteNumber(language.avg_confidence) && isFiniteNumber(previous?.avg_confidence)
                  ? language.avg_confidence - previous.avg_confidence
                  : null;

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
                <section key={language.language ?? i} className="dashboard-row dashboard-row--3col">
                  <span>{getLanguageName(language.language)}</span>
                  <span className="dashboard-col-center">{formatFixed(delta, 1)}</span>
                  <span className="dashboard-col-right">
                    {label}
                    {driftStatus && (
                      <span className={`dashboard-status-dot dashboard-status-${driftStatus}`} />
                    )}
                  </span>
                </section>
              );
            })
          ) : (
            <p>No drift data available for this run.</p>
          )}
        </section>

        {/* ── AI System Intelligence ────────────────────────────────────────── */}
        {story && (
          <section className="dashboard-card" id={sectionId("AI System Intelligence")}>
            <h2>AI System Intelligence</h2>
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
            Recent run history for at-a-glance health comparison across the five latest CI runs.
          </p>
          {last5.length > 0 ? (
            <>
              <section className="dashboard-row dashboard-row-header">
                <span>Date</span>
                <span>Latency (ms)</span>
                <span>Confidence</span>
                <span>Reliability</span>
              </section>
              {last5.map((run) => (
                <section key={run.run_id} className="dashboard-row">
                  <span>{new Date(run.run_timestamp).toLocaleDateString()}</span>
                  <span>{isFiniteNumber(run.p95_latency) ? `${run.p95_latency} ms` : "N/A"}</span>
                  <span>{formatFixed(run.avg_confidence, 2)}</span>
                  <span>{formatFixed(run.reliability_score, 2)}</span>
                </section>
              ))}
            </>
          ) : (
            <p>No run history available yet.</p>
          )}
        </section>

        {/* ── Test Reliability — Flakiness aggregate ───────────────────────── */}
        <section className="dashboard-card" id={sectionId("Test Reliability - Flakiness")}>
          <h2>Test Reliability — Flakiness</h2>
          <p className="dashboard-section-desc">
            Tracks test instability over time. High flakiness reduces confidence in results and
            may mask real regressions.
          </p>

          {!flakiness && flakinessTrend.length === 0 ? (
            <p>No flakiness data available yet. Run tests to populate reliability metrics.</p>
          ) : (
            <>
              <h3>Current State</h3>
              <p>
                Flakiness:{" "}
                <b>{formatPercentFromWhole(flakiness?.flakiness_pct)}</b>
                {" — "}
                <b>{getFlakinessRisk(flakiness?.flakiness_pct)}</b>
                {isFiniteNumber(flakiness?.flakiness_pct) && (
                  <span
                    className={`dashboard-status-dot dashboard-status-${getStatusColor(flakiness.flakiness_pct, "flakiness") ?? "green"}`}
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

              <h3>Historical Trend</h3>
              {flakinessChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={flakinessChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
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
              <section className="dashboard-row dashboard-row-header dashboard-row--flaky">
                <span>Test Name</span>
                <span className="dashboard-col-center">Flakiness %</span>
                <span className="dashboard-col-center">Flaky / Total</span>
                <span className="dashboard-col-center">Severity</span>
                <span className="dashboard-col-center">Recency</span>
              </section>
              {flakyTests.map((test, i) => (
                <section key={test.test_name ?? i} className="dashboard-row dashboard-row--flaky">
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
          <h2>System Risk Assessment</h2>
          <p className="dashboard-section-desc">
            Aggregated risk summary across retrieval quality and test stability. Immediate action
            recommended when both stability signals are degraded.
          </p>
          <p>
            Worst-case confidence:{" "}
            <b>{worstLanguage ? formatFixed(worstLanguage.min_confidence, 1) : "N/A"}</b>
          </p>
          <p>
            Stability:{" "}
            <b>
              {languageMetrics.some(isUnstable)
                ? "Retrieval instability detected"
                : isFiniteNumber(flakiness?.flakiness_pct) && flakiness.flakiness_pct > 2
                  ? "Test instability (flaky suite)"
                  : "Stable system"}
            </b>
          </p>
        </section>
      </main>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Metric({ title, value, subtitle, status, onClick }: MetricProps) {
  return (
    <button type="button" className="dashboard-metric" onClick={onClick}>
      <div>{title}</div>
      <div className="dashboard-metric-value">
        {value}
        {status && <span className={`dashboard-status-dot dashboard-status-${status}`} />}
      </div>
      {subtitle && <div className="dashboard-metric-subtitle">{subtitle}</div>}
    </button>
  );
}

function Insight({ metric }: InsightProps) {
  let message = "";
  if (metric === "Latency") message = "Increased latency may degrade LLM response quality.";
  if (metric === "Reliability") message = "Reliability drop indicates regression risk.";
  if (metric === "Confidence") message = "Lower confidence suggests retrieval degradation.";
  if (metric === "Rate") message = "Rate limit issues may block users.";
  return <p className="dashboard-insight-text">{message}</p>;
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
