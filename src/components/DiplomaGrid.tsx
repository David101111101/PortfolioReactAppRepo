import { useMemo, useState, useEffect } from "react";
import type { Diploma } from "../data/portfolio";

const categories: Diploma["category"][] = ["Automation", "Engineering", "QA", "Other"];

export function DiplomaGrid({ diplomas }: { diplomas: Diploma[] }) {
  const [cat, setCat] = useState<Diploma["category"] | null>(null); // null = All
  const [showAll, setShowAll] = useState(false);

  // Base list (category filter only)
  const base = useMemo(() => {
    return cat ? diplomas.filter((d) => d.category === cat) : diplomas;
  }, [cat, diplomas]);

  const canToggle = base.length > 8;

  // Optional UX guard: if there aren't enough items to expand, force "Show fewer" mode
  useEffect(() => {
    if (!canToggle && showAll) setShowAll(false);
  }, [canToggle, showAll]);

  // Visible list (after showAll/slice)
  const visible = useMemo(() => {
    return showAll ? base : base.slice(0, 8);
  }, [base, showAll]);

  return (
    <>
      <div className="ContainerOfBtn" style={{ marginBottom: 14 }}>
        {categories.map((c) => {
          const active = cat === c;
          return (
            <button
              key={c}
              className="btn"
              onClick={() => setCat((prev) => (prev === c ? null : c))}
              aria-pressed={active}
            >
              {c}
            </button>
          );
        })}

        {canToggle && (
          <button className="btn primary" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show fewer" : "Show all"}
          </button>
        )}
      </div>

      <div className="grid cols-4">
        {visible.map((d) => (
          <article key={`${d.title}-${d.issuer}`} className="card" style={{ padding: 16 }}>
            {d.image ? (
              <img
                src={`${import.meta.env.BASE_URL}${d.image}`}
                alt={`${d.title} certificate`}
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
