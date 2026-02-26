import { useEffect, useState } from "react";
import { profile } from "../data/portfolio";
import { showThemeOverlay } from "../themeOverlay";

declare global {
  interface Window {
    showThemeOverlay?: (theme: "dark" | "light") => void;
  }
}

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

    // Determine the next theme based on the current theme
    const next = theme === "dark" ? "light" : "dark";
    // Trigger overlay animation
    showThemeOverlay();
    // Add a temporary class so transitions feel intentional
    document.documentElement.classList.add("theme-transition");
    // Change theme/background color after 2s (when panels meet)
    window.setTimeout(() => {
      setTheme(next);
      localStorage.setItem("theme", next);
      document.documentElement.setAttribute("data-theme", next);
      // Remove the transition class after a short delay to allow the transition to complete
      window.setTimeout(() => {
        document.documentElement.classList.remove("theme-transition");
      }, 320);
    }, 2000);// 2s matches the panel animation duration
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
        <a id="titleName" href="#top" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
          {profile.name}
        </a>

        <nav style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <a className="badge" href={`${import.meta.env.BASE_URL}${profile.resume}`} target="_blank" rel="noreferrer">Resume</a>
          <a className="badge" href="#projects">Projects</a>
          <a className="badge" href="#diplomas">Diplomas</a>
          <a className="badge" href="#experience">Experience</a>
          <a className="badge" href="#contact">Contact</a>

          <button id="theme-toggle" className="btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? (
              // Sun icon for switching to light mode
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                <g clipPath="url(#clip0_2880_7340)">
                  <path d="M8 1.11133V2.00022" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M12.8711 3.12891L12.2427 3.75735" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M14.8889 8H14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M12.8711 12.8711L12.2427 12.2427" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M8 14.8889V14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M3.12891 12.8711L3.75735 12.2427" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M1.11133 8H2.00022" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M3.12891 3.12891L3.75735 3.75735" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M8.00043 11.7782C10.0868 11.7782 11.7782 10.0868 11.7782 8.00043C11.7782 5.91402 10.0868 4.22266 8.00043 4.22266C5.91402 4.22266 4.22266 5.91402 4.22266 8.00043C4.22266 10.0868 5.91402 11.7782 8.00043 11.7782Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                </g>
                <defs>
                  <clipPath id="clip0_2880_7340">
                    <rect width="16" height="16" fill="white"></rect>
                  </clipPath>
                </defs>
              </svg>
            ) : (
              // Moon icon for switching to dark mode
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
