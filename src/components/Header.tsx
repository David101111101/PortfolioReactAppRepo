import { useEffect, useState } from "react";
import { profile } from "../data/portfolio";

function getInitialTheme(): "dark" | "light" {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: light)")?.matches ? "light" : "dark";
}

export function Header() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

 function toggleTheme() {
  const next = theme === "dark" ? "light" : "dark";

  // Add a temporary class so transitions feel intentional
  document.documentElement.classList.add("theme-transition");

  setTheme(next);
  localStorage.setItem("theme", next);
  document.documentElement.setAttribute("data-theme", next);

  window.setTimeout(() => {
    document.documentElement.classList.remove("theme-transition");
  }, 320);
}

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(10px)",
        background: "rgba(0,0,0,0.02)",
        boxShadow: "rgba(0, 0, 0, 0.4) 15px 5px 5px 1px",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
        }}
      >
        <a href="#top" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
          {profile.name}
        </a>

        <nav style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <a className="badge" href={profile.resume} target="_blank" rel="noreferrer">Resume</a>
          <a className="badge" href="#projects">Projects</a>
          <a className="badge" href="#diplomas">Diplomas</a>
          <a className="badge" href="#experience">Experience</a>
          <a className="badge" href="#contact">Contact</a>

          <button className="btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </nav>
      </div>
    </header>
  );
}
