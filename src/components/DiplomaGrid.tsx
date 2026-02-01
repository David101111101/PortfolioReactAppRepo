import { useMemo, useState } from "react";
import type { Diploma } from "../data/portfolio";

const categories: Diploma["category"][] = ["QA", "Automation", "Engineering", "Leadership", "Other"];

export function DiplomaGrid({ diplomas }: { diplomas: Diploma[] }) {
  const [cat, setCat] = useState<Diploma["category"] | "All">("All");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const base = cat === "All" ? diplomas : diplomas.filter((d) => d.category === cat);
    return showAll ? base : base.slice(0, 8);
  }, [cat, showAll, diplomas]);

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <button className="btn" onClick={() => setCat("All")} aria-pressed={cat === "All"}>
          All
        </button>
        {categories.map((c) => (
          <button key={c} className="btn" onClick={() => setCat(c)} aria-pressed={cat === c}>
            {c}
          </button>
        ))}
        <button className="btn primary" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer" : "Show all"}
        </button>
      </div>

      <div className="grid cols-4">
        {filtered.map((d) => (
          <article key={`${d.title}-${d.issuer}`} className="card" style={{ padding: 16 }}>
            {d.image ? (
              <img
                src={d.image}
                alt={`${d.title} diploma`}
                style={{
                  width: "100%",
                  height: 140,
                  objectFit: "cover",
                  borderRadius: 12,
                  border: "1px solid var(--soft)",
                  marginBottom: 10,
                }}
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  height: 140,
                  borderRadius: 12,
                  border: "1px dashed var(--soft)",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                  fontSize: 12,
                }}
              >
                Add image in /public (optional)
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <span className="badge">{d.category}</span>
              {d.year ? <span className="badge">{d.year}</span> : null}
            </div>

            <h3 style={{ margin: 0, fontSize: 16 }}>{d.title}</h3>
            <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>{d.issuer}</p>

            {d.proof ? (
              <div style={{ marginTop: 12 }}>
                <a className="btn" href={d.proof.href} target="_blank" rel="noreferrer">
                  {d.proof.label}
                </a>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
