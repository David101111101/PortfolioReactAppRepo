import type { Project } from "../data/portfolio";

function statusBadge(status?: Project["status"]) {
  if (!status) return null;
  const map: Record<string, { text: string; tone: string }> = {
    public: { text: "Public", tone: "var(--ok)" },
    nda: { text: "NDA-Safe", tone: "var(--warn)" },
    private: { text: "Private", tone: "var(--muted)" },
  };
  const m = map[status];
  if (!m) return null;

  return (
    <span className="badge" style={{ borderColor: "var(--soft)", color: m.tone }}>
      {m.text}
    </span>
  );
}

export function ProjectCard({ p }: { p: Project }) {
  return (
    <article className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        
        <div>
          <h3 style={{ margin: 0, fontSize: 18 }}>{p.title} {statusBadge(p.status)}</h3>
          <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{p.oneLiner}</p>
        </div>
        
      </div>

      <p style={{ margin: "14px 0 0", color: "var(--muted)" }}>{p.description}</p>

      <ul style={{ margin: "12px 0 0", paddingLeft: 18, color: "var(--text)" }}>
        {p.highlights.map((h) => (
          <li key={h} style={{ marginBottom: 6 }}>{h}</li>
        ))}
      </ul>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {p.tech.map((t) => (
          <span key={t} className="badge">{t}</span>
        ))}
      </div>

      {p.links?.length ? (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
    {p.links.map((l) => (
      <a
        key={l.href + l.label}
        className="btn"
        href={l.href}
        target="_blank"
        rel="noreferrer"
      >
        {l.label}
      </a>
    ))}
  </div>
) : null}

    </article>
  );
}
