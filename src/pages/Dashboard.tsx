import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

type MetricKey = "latency" | "reliability" | "confidence" | "rate";

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

export default function Dashboard() {
  const [trend, setTrend] = useState<Run[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [story, setStory] = useState<RegressionStory | null>(null);
  const last5 = trend.slice(0, 5);
  const [comparison, setComparison] = useState<RegressionComparison | null>(null);
  const [languageMetrics, setLanguageMetrics] = useState<LanguageMetric[]>([]);
 
  useEffect(() => {
  if (!hasSupabaseConfig) return;

  fetch(`${supabaseUrl}/rest/v1/regression_run_comparison?order=run_timestamp.desc&limit=1`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Comparison API error");
      return res.json();
    })
    .then(data => {
      setComparison(data?.[0]);
    })
    .catch(err => console.error("Comparison fetch error:", err));

}, [hasSupabaseConfig, supabaseKey, supabaseUrl]);
  useEffect(() => {
    if (!hasSupabaseConfig) return;
    fetch(`${supabaseUrl}/rest/v1/regression_story?order=run_timestamp.desc&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
  })
    .then(res => {
      if (!res.ok) throw new Error("Story API error");
      return res.json();
    })
    .then(data => {
      setStory(data?.[0]);
    })
    .catch(err => console.error("Story fetch error:", err));
}, [hasSupabaseConfig, supabaseKey, supabaseUrl]);


  // 🔹 Load runs
  useEffect(() => {
    if (!hasSupabaseConfig) {
      return;
    }

    fetch(`${supabaseUrl}/rest/v1/regression_run_summary?order=run_timestamp.desc`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(data => {
          if (!data || data.length === 0) {
            console.warn("⚠️ No data returned from Supabase");
          }
        setRuns(data || []);
        if (data.length > 0) setSelectedRun(data[0]);
      })
  .catch(err => console.error("Fetch error:", err));
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  // 🔹 Load trends
  useEffect(() => {
    if (!hasSupabaseConfig) {
      return;
    }

    fetch(`${supabaseUrl}/rest/v1/regression_run_summary?order=run_timestamp.desc&limit=10`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    })
      .then(res => res.json())
      .then(setTrend);
      
  }, [hasSupabaseConfig, supabaseKey, supabaseUrl]);

  useEffect(() => {
  if (!hasSupabaseConfig || !selectedRun) return;

  fetch(
    `${supabaseUrl}/rest/v1/retrieval_language_summary?run_id=eq.${selectedRun.run_id}`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    }
  )
    .then(res => {
      if (!res.ok) throw new Error("Language summary fetch error");
      return res.json();
    })
    .then(data => setLanguageMetrics(data || []))
    .catch(err => console.error("Language metrics error:", err));
}, [selectedRun, hasSupabaseConfig, supabaseKey, supabaseUrl]);

  const handleRunChange = (id: string) => {
    const run = runs.find((currentRun) => currentRun.run_id === String(id));
    if (run) {
      setSelectedRun(run);
    }
  };
  const getRateLimitLabel = (rate: number) => {
    if (rate < 0.1) return "🟢 Low impact";
    if (rate < 0.3) return "🟡 Moderate throttling";
    return "🔴 High user impact";
  };

  if (!hasSupabaseConfig) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1>🧠 AI System Dashboard</h1>
          <p>Dashboard data is not configured for this Vite app.</p>
          <p>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the active .env file.</p>
        </div>
      </div>
    );
  }

  if (!selectedRun) return <div>Loading...</div>;
  const chartData = trend.map(t => ({
    date: new Date(t.run_timestamp).toLocaleDateString(),
    latency: t.p95_latency,
    confidence: t.avg_confidence,
    reliability: t.reliability_score,
    rate: t.enforcement_rate
  }));
  const latest = trend[0];
  const previous = trend[1];

  const latencySpike =
  latest && previous &&
  latest.p95_latency > previous.p95_latency * 1.2;

  const getRankShiftLabel = (value: number) => {
    if (value < 0.2) return "🟢 Stable retrieval";
    if (value < 0.5) return "🟡 Moderate drift";
    return "🔴 High ranking instability";
  };

  const getLatencyDeltaLabel = (pct: number) => {
    if (pct > 0.2) return "🔴 Significant slowdown";
    if (pct > 0) return "🟡 Slight slowdown";
    if (pct > -0.2) return "🟢 Slight improvement";
    return "🟢 Major improvement";
  };

  const getConfidenceDeltaLabel = (pct: number) => {
    if (pct < -0.1) return "🔴 Confidence drop";
    if (pct < 0) return "🟡 Slight drop";
    if (pct < 0.1) return "🟢 Stable";
    return "🟢 Improved";
  };

  const languageMap: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
    zh: "Chinese",
    ja: "Japanese"
  };  
  const getLanguageName = (code: string) =>
    languageMap[code] || code;
  const getLanguageRisk = (l: LanguageMetric) => {
    if (l.min_confidence < 60) return "🔴 Critical";
    if (l.min_confidence < 75) return "🟡 Risk";
    return "🟢 Healthy";
  };
  const isUnstable = (l: LanguageMetric) =>
    l.avg_confidence - l.min_confidence > 15;
  const sortedLanguages = [...languageMetrics].sort(
    (a, b) => a.min_confidence - b.min_confidence
  );
  const worstLanguage = sortedLanguages[0];



  
  return (
    <div style={styles.container}>
      <h1>🧠 AI System Dashboard</h1>

      {/* 🔹 Run Selector */}
      <div style={styles.card}>
        <label>Select Run: </label>
        <select onChange={(e) => handleRunChange(e.target.value)}>
          {runs.map(run => (
            <option key={run.run_id} value={run.run_id}>
              Run {run.run_id} — {new Date(run.run_timestamp).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {/* 🔹 Metrics Grid */}
      <div style={styles.grid}>
        <Metric
          title="P95 Latency"
          value={`${selectedRun.p95_latency} ms`}
          onClick={() => setSelectedMetric("latency")}
        />
        <Metric
          title="Reliability"
          value={`${(selectedRun.reliability_score).toFixed(1)}%`}
          onClick={() => setSelectedMetric("reliability")}
        />
        <Metric
          title="Confidence"
          value={`${(selectedRun.avg_confidence).toFixed(1)}%`}
          onClick={() => setSelectedMetric("confidence")}
        />
        <Metric
          title="Rate Limit"
          value={`${(selectedRun.enforcement_rate * 100).toFixed(1)}%`}
          subtitle={getRateLimitLabel(selectedRun.enforcement_rate)}
          onClick={() => setSelectedMetric("rate")}
        />
      </div>

      {comparison && (
        <div style={styles.card}>
        <h2>📊 Regression Impact (vs Previous Run)</h2>

        <div style={styles.row}>
          <span>Latency</span>
          <span>{(comparison.latency_pct * 100).toFixed(1)}%</span>
          <span>{getLatencyDeltaLabel(comparison.latency_pct)}</span>
        </div>

        <div style={styles.row}>
          <span>Confidence</span>
          <span>{(comparison.confidence_pct * 100).toFixed(1)}%</span>
          <span>{getConfidenceDeltaLabel(comparison.confidence_pct)}</span>
        </div>

        <div style={styles.row}>
          <span>Reliability</span>
          <span>{(comparison.reliability_delta * 100).toFixed(1)}%</span>
          <span>
            {comparison.reliability_delta < 0
              ? "🔴 Degradation"
              : "🟢 Improvement"}
          </span>
        </div>
      </div>
      )}
      
      <div style={styles.card}>
        <h2>📈 System Trends</h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            
            <XAxis 
              dataKey="date" 
              label={{ value: "Run Date", position: "insideBottom", offset: -5 }} 
            />
            <YAxis 
              label={{ 
                value: "Metrics", 
                angle: -90, 
                position: "insideLeft" 
              }} 
            />
            <Tooltip />

            <Line type="monotone" name="Latency (ms)" dataKey="latency" />
            <Line type="monotone" name="Confidence Score" dataKey="confidence" />
            <Line type="monotone" name="Reliability Score" dataKey="reliability" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 🔹 Drill-down Panel */}
      {selectedMetric && (
        <div style={styles.card}>
          <h2>📊 {selectedMetric} Trend</h2>
           {latencySpike && selectedMetric === "latency" && (
              <p style={{ color: "orange" }}>
                ⚠️ Latency increased &gt;20% vs previous run
              </p>
            )}

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />

              {selectedMetric === "latency" && <Line dataKey="latency" />}
              {selectedMetric === "confidence" && <Line dataKey="confidence" />}
              {selectedMetric === "reliability" && <Line dataKey="reliability" />}
              {selectedMetric === "rate" && <Line dataKey="rate" />}
            </LineChart>
          </ResponsiveContainer>

          <Insight metric={selectedMetric} />
        </div>
      )}

      {/* 🔹 Multilingual */}
            {/* 🌍 Multilingual Intelligence */}
      <div style={styles.card}>
        <h2>🌍 Multilingual Retrieval Intelligence</h2>

        <h4>📊 Current State</h4>
        {sortedLanguages.map(l => (
          <div key={l.language} style={styles.row}>
            <span>{getLanguageName(l.language)}</span>
            <span>avg={l.avg_confidence.toFixed(1)} | min={l.min_confidence.toFixed(1)}</span>
            <span>{getLanguageRisk(l)} {isUnstable(l) ? "⚠️ Unstable" : ""}</span>
          </div>
        ))}

        {worstLanguage && (
          <>
            <h4>⚠️ Highest Risk</h4>
            <p>
              <b>{getLanguageName(worstLanguage.language)} — min {worstLanguage.min_confidence.toFixed(1)}</b>
            </p>
          </>
        )}

        <h4>🔬 Retrieval Stability</h4>
        <p>
          {selectedRun.avg_rank_shift.toFixed(3)} — <b>{getRankShiftLabel(selectedRun.avg_rank_shift)}</b>
        </p>
      </div>
      {/* 📉 Drift */}
      <div style={styles.card}>
        <h2>📉 Language Drift (Approx)</h2>

        {languageMetrics.map(l => {
          const prev = trend[1];
          const delta = prev ? l.avg_confidence - prev.avg_confidence : 0;

          const label =
            delta < -10 ? "🔻 Regression" :
            delta < -3 ? "⚠️ Drop" :
            delta > 3 ? "🔼 Improvement" :
            "➖ Stable";

          return (
            <div key={l.language} style={styles.row}>
              <span>{getLanguageName(l.language)}</span>
              <span>{delta.toFixed(1)}</span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
      {story && (
        <div style={styles.card}>
          <h2>🧠 AI System Intelligence</h2>

          <p>Trend: <b>{story.trend_direction}</b></p>
          <p>Severity: <b>{story.regression_severity}</b></p>
          <p>Primary Signal: <b>{story.primary_signal}</b></p>
          <p>User Impact: <b>{story.user_impact}</b></p>
          <p>Analysis Confidence: <b>{story.analysis_confidence}</b></p>
        </div>
      )}

      <div style={styles.card}>
        <h2>📉 Last 5 Runs Trend</h2>

        {/* Header */}
        <div style={{ ...styles.row, fontWeight: "bold", opacity: 0.7 }}>
          <span>Date</span>
          <span>Latency (ms)</span>
          <span>Confidence</span>
          <span>Reliability</span>
        </div>

        {last5.map(r => (
          <div key={r.run_id} style={styles.row}>
            <span>{new Date(r.run_timestamp).toLocaleDateString()}</span>
            <span>{r.p95_latency} ms</span>
            <span>{r.avg_confidence?.toFixed(2)}</span>
            <span>{r.reliability_score?.toFixed(2)}</span>
          </div>
        ))}
      </div>
      {/* 🧠 Risk Summary */}
      <div style={styles.card}>
        <h2>🧠 AI Risk Summary</h2>

        <p>
          Worst-case confidence: <b>{worstLanguage?.min_confidence.toFixed(1)}</b>
        </p>

        <p>
          Stability:{" "}
          <b>
            {languageMetrics.some(isUnstable)
              ? "⚠️ Non-deterministic behavior detected"
              : "🟢 Stable system"}
          </b>
        </p>
      </div>
    </div>
  );
}

// 🔹 Metric Card
function Metric({ title, value, subtitle, onClick }: MetricProps) {
  return (
    <div onClick={onClick} style={styles.metric}>
      <div>{title}</div>
      <div style={styles.metricValue}>{value}</div>

      {subtitle && (
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
// 🔹 Insight Component
function Insight({ metric }: InsightProps) {
  let message = "";

  if (metric === "latency") {
    message = "⚠️ Increased latency may degrade LLM response quality.";
  }
  if (metric === "reliability") {
    message = "📉 Reliability drop indicates regression risk.";
  }
  if (metric === "confidence") {
    message = "🧠 Lower confidence suggests retrieval degradation.";
  }
  if (metric === "rate") {
    message = "🚦 Rate limit issues may block users.";
  }

  return (
    <p style={{ marginTop: 10, color: "orange" }}>
      {message}
    </p>
  );
}

// 🔹 Styles
const styles = {
  container: {
    padding: 20,
    color: "white",
    background: "#0b1020",
    minHeight: "100vh"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginTop: 20
  },
  card: {
    background: "#111827",
    padding: 20,
    borderRadius: 12,
    marginTop: 20
  },
  metric: {
    background: "#1f2937",
    padding: 20,
    borderRadius: 12,
    cursor: "pointer"
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold"
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6
  }
};