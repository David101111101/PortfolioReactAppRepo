import { useEffect, useState } from "react";
import { HeaderDashboard } from "../components/HeaderDashboard";
import "../styles/Dashboard.css";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MetricKey = "Latency" | "Reliability" | "Confidence" | "Rate";

type Run = {
  run_id: string;
  run_timestamp: string;
  p95_latency: number;
  reliability_score: number;
  avg_confidence: number;
  enforcement_rate: number;
  avg_rank_shift: number;
};

type MetricProps = {
  title: string;
  value: string;
  subtitle?: string;
  onClick: () => void;
};

type InsightProps = {
  metric: MetricKey;
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

export default function Dashboard() {
  const [trend, setTrend] = useState<Run[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [story, setStory] = useState<RegressionStory | null>(null);
  const [comparison, setComparison] = useState<RegressionComparison | null>(null);
  const [languageMetrics, setLanguageMetrics] = useState<LanguageMetric[]>([]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    fetch(`${supabaseUrl}/rest/v1/regression_run_comparison?order=run_timestamp.desc&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Comparison API error");
        return res.json();
      })
      .then((data) => setComparison(data?.[0]))
      .catch((err) => console.error("Comparison fetch error:", err));
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    fetch(`${supabaseUrl}/rest/v1/regression_story?order=run_timestamp.desc&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Story API error");
        return res.json();
      })
      .then((data) => setStory(data?.[0]))
      .catch((err) => console.error("Story fetch error:", err));
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    fetch(`${supabaseUrl}/rest/v1/regression_run_summary?order=run_timestamp.desc`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setRuns(data || []);
        if (data?.length > 0) setSelectedRun(data[0]);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    fetch(`${supabaseUrl}/rest/v1/regression_run_summary?order=run_timestamp.desc&limit=10`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })
      .then((res) => res.json())
      .then(setTrend)
      .catch((err) => console.error("Trend fetch error:", err));
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  useEffect(() => {
    if (!hasSupabaseConfig || !selectedRun) return;

    fetch(`${supabaseUrl}/rest/v1/retrieval_language_summary?run_id=eq.${selectedRun.run_id}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Language summary fetch error");
        return res.json();
      })
      .then((data) => setLanguageMetrics(data || []))
      .catch((err) => console.error("Language metrics error:", err));
  }, [selectedRun, hasSupabaseConfig, supabaseKey, supabaseUrl]);

  const handleRunChange = (id: string) => {
    const run = runs.find((currentRun) => currentRun.run_id === id);
    if (run) setSelectedRun(run);
  };

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

  if (!hasSupabaseConfig) {
    return (
      <section id={sectionId("AI System Dashboard")}>
        <section className="dashboard-card" id={sectionId("Dashboard Configuration")}>
          <h1>AI System Dashboard</h1>
          <p>Dashboard data is not configured for this Vite app.</p>
          <p>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the active .env file.</p>
        </section>
      </section>
    );
  }

  if (!selectedRun) {
    return <section className="dashboard-page">Loading...</section>;
  }

  const chronologicalTrend = [...trend].sort(
    (a, b) => new Date(a.run_timestamp).getTime() - new Date(b.run_timestamp).getTime()
  );

  const chartData = chronologicalTrend.map((entry) => ({
    date: new Date(entry.run_timestamp).toLocaleDateString(),
    latency: entry.p95_latency,
    confidence: entry.avg_confidence,
    reliability: entry.reliability_score,
    rate: entry.enforcement_rate,
  }));

  const latest = trend[0];
  const previous = trend[1];
  const last5 = trend.slice(0, 5);
  const latencySpike =
    isFiniteNumber(latest?.p95_latency) &&
    isFiniteNumber(previous?.p95_latency) &&
    latest.p95_latency > previous.p95_latency * 1.2;

  const sortedLanguages = [...languageMetrics].sort(
    (a, b) => a.min_confidence - b.min_confidence
  );
  const worstLanguage = sortedLanguages[0];
  const hasLanguageMetrics = languageMetrics.length > 0;

  return (
    <section className="dashboard-page" id={sectionId("AI System Dashboard")}>
      <HeaderDashboard />
      <section className="bg bg-dark" aria-hidden="true" />
      <section className="bg bg-light" aria-hidden="true" />

      <main id="content" className="dashboard-main">
        <h1>AI System Dashboard</h1>

        <section className="dashboard-card" id={sectionId("Run Selector")}>
          <h2>Run Selector</h2>
          <label htmlFor="run-selector">Select Run:</label>
          <select id="run-selector" className="dashboard-select" onChange={(e) => handleRunChange(e.target.value)}>
            {runs.map((run) => (
              <option key={run.run_id} value={run.run_id}>
                Run {run.run_id} - {new Date(run.run_timestamp).toLocaleString()}
              </option>
            ))}
          </select>
        </section>

        <section className="dashboard-card" id={sectionId("Key Metrics")}>
          <h2>Key Metrics</h2>
          <section className="dashboard-grid">
            <Metric
              title="P95 Latency"
              value={isFiniteNumber(selectedRun.p95_latency) ? `${selectedRun.p95_latency} ms` : "N/A"}
              onClick={() => setSelectedMetric("Latency")}
            />
            <Metric
              title="Reliability"
              value={formatPercentFromWhole(selectedRun.reliability_score)}
              onClick={() => setSelectedMetric("Reliability")}
            />
            <Metric
              title="Confidence"
              value={formatPercentFromWhole(selectedRun.avg_confidence)}
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

        {selectedMetric && (
          <section className="dashboard-card" id={sectionId(`${selectedMetric} Trend`)}>
            <h2>{selectedMetric} Trend</h2>
            {latencySpike && selectedMetric === "Latency" && (
              <p className="dashboard-warning-text">Latency increased more than 20% vs previous run</p>
            )}
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                {selectedMetric === "Latency" && <Line dataKey="Latency" />}
                {selectedMetric === "Confidence" && <Line dataKey="Confidence" />}
                {selectedMetric === "Reliability" && <Line dataKey="Reliability" />}
                {selectedMetric === "Rate" && <Line dataKey="Rate" />}
              </LineChart>
            </ResponsiveContainer>
            <Insight metric={selectedMetric} />
          </section>
        )}

        {comparison && (
          <section className="dashboard-card" id={sectionId("Regression Impact vs Previous Run")}>
            <h2>Regression Impact (vs Previous Run)</h2>
            <section className="dashboard-row">
              <span>Latency</span>
              <span>{formatPercentFromRatio(comparison.latency_pct)}</span>
              <span>{getLatencyDeltaLabel(comparison.latency_pct)}</span>
            </section>
            <section className="dashboard-row">
              <span>Confidence</span>
              <span>{formatPercentFromRatio(comparison.confidence_pct)}</span>
              <span>{getConfidenceDeltaLabel(comparison.confidence_pct)}</span>
            </section>
            <section className="dashboard-row">
              <span>Reliability</span>
              <span>{formatPercentFromRatio(comparison.reliability_delta)}</span>
              <span>
                {isFiniteNumber(comparison.reliability_delta)
                  ? comparison.reliability_delta < 0
                    ? "Degradation"
                    : "Improvement"
                  : "No comparison data"}
              </span>
            </section>
          </section>
        )}

        <section className="dashboard-card" id={sectionId("System Trends")}>
          <h2>System Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" label={{ value: "Run Date", position: "insideBottom", offset: -5 }} />
              <YAxis label={{ value: "Metrics", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Line type="monotone" name="Latency (ms)" dataKey="latency" />
              <Line type="monotone" name="Confidence Score" dataKey="confidence" />
              <Line type="monotone" name="Reliability Score" dataKey="Reliability" />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="dashboard-card" id={sectionId("Multilingual Retrieval Intelligence")}>
          <h2>Multilingual Retrieval Intelligence</h2>
          <h3>Current State</h3>
          {hasLanguageMetrics ? (
            sortedLanguages.map((language) => (
              <section key={language.language} className="dashboard-row">
                <span>{getLanguageName(language.language)}</span>
                <span>
                  avg={formatFixed(language.avg_confidence, 1)} | min={formatFixed(language.min_confidence, 1)}
                </span>
                <span>
                  {getLanguageRisk(language)} {isUnstable(language) ? "Unstable" : ""}
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
                  {getLanguageName(worstLanguage.language)} - min {formatFixed(worstLanguage.min_confidence, 1)}
                </b>
              </p>
            </>
          )}

          <h3>Retrieval Stability</h3>
          <p>
            {formatFixed(selectedRun.avg_rank_shift, 3)} - <b>{getRankShiftLabel(selectedRun.avg_rank_shift)}</b>
          </p>
        </section>

        <section className="dashboard-card" id={sectionId("Language Drift Approx")}>
          <h2>Language Drift (Approx)</h2>
          {hasLanguageMetrics ? (
            languageMetrics.map((language) => {
              const delta =
                isFiniteNumber(language.avg_confidence) && isFiniteNumber(previous?.avg_confidence)
                  ? language.avg_confidence - previous.avg_confidence
                  : null;

              const label =
                !isFiniteNumber(delta)
                  ? "No drift data"
                  : delta < -10
                    ? "Regression"
                    : delta < -3
                      ? "Drop"
                      : delta > 3
                        ? "Improvement"
                        : "Stable";

              return (
                <section key={language.language} className="dashboard-row">
                  <span>{getLanguageName(language.language)}</span>
                  <span>{formatFixed(delta, 1)}</span>
                  <span>{label}</span>
                </section>
              );
            })
          ) : (
            <p>No drift data available for this run.</p>
          )}
        </section>

        {story && (
          <section className="dashboard-card" id={sectionId("AI System Intelligence")}>
            <h2>AI System Intelligence</h2>
            <p>Trend: <b>{story.trend_direction}</b></p>
            <p>Severity: <b>{story.regression_severity}</b></p>
            <p>Primary Signal: <b>{story.primary_signal}</b></p>
            <p>User Impact: <b>{story.user_impact}</b></p>
            <p>Analysis Confidence: <b>{story.analysis_confidence}</b></p>
          </section>
        )}

        <section className="dashboard-card" id={sectionId("Last 5 Runs Trend")}>
          <h2>Last 5 Runs Trend</h2>
          <section className="dashboard-row dashboard-row-header">
            <span>Date</span>
            <span>Latency (ms)</span>
            <span>Confidence</span>
            <span>Reliability</span>
          </section>
          {last5.map((run) => (
            <section key={run.run_id} className="dashboard-row">
              <span>{new Date(run.run_timestamp).toLocaleDateString()}</span>
              <span>{run.p95_latency} ms</span>
              <span>{run.avg_confidence?.toFixed(2)}</span>
              <span>{run.reliability_score?.toFixed(2)}</span>
            </section>
          ))}
        </section>

        <section className="dashboard-card" id={sectionId("AI Risk Summary")}>
          <h2>AI Risk Summary</h2>
          <p>
            Worst-case confidence: <b>{worstLanguage ? worstLanguage.min_confidence.toFixed(1) : "N/A"}</b>
          </p>
          <p>
            Stability: <b>{languageMetrics.some(isUnstable) ? "Non-deterministic behavior detected" : "Stable system"}</b>
          </p>
        </section>
      </main>
    </section>
  );
}

function Metric({ title, value, subtitle, onClick }: MetricProps) {
  return (
    <button
      type="button"
      className="dashboard-metric"
      onClick={onClick}
    >
      <div>{title}</div>
      <div className="dashboard-metric-value">{value}</div>
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
