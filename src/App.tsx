import "./App.css";
import { Header } from "./components/Header";
import { Section } from "./components/Section";
import { DiplomaGrid } from "./components/DiplomaGrid";
import { ProjectCard } from "./components/ProjectCard";
import { diplomas, experiences, otherExperience, profile, projects, skills, stats } from "./data/portfolio";

function MailToButton() {
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      alert("Email copied!");
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <a className="btn primary" href={`mailto:${profile.email}`}>
        Email me
      </a>
      <button className="btn" onClick={copyEmail}>
        Copy email
      </button>
      <a className="btn" href={profile.linkedin} target="_blank" rel="noreferrer">
        LinkedIn
      </a>
      <a className="btn" href={profile.github} target="_blank" rel="noreferrer">
        GitHub
      </a>
    </div>
  );
}

export default function App() {
  return (
    
    <section id="top">
      <Header />
      <div className="bg bg-dark" aria-hidden="true" />
      <div className="bg bg-light" aria-hidden="true" />

      

      <main id="content">
        {/* HERO */}
        <section className="section" style={{ paddingTop: 20 }}>
          <div className="container">
            <div className="grid cols-2" style={{ alignItems: "start" }}>
              <div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                  <span className="badge">{profile.role}</span>
                  <span className="badge">{profile.languages}</span>
                </div>

                <h1 style={{ margin: 0, fontSize: 44, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                  Quality you can trust.
                  <span style={{ display: "block", color: "var(--muted)", fontSize: 22, marginTop: 10 }}>
                    Automation engineered for reliability, not noise.
                  </span>
                </h1>

                <p style={{ color: "var(--muted)", maxWidth: "68ch", marginTop: 16, fontSize: 16, lineHeight: 1.6 }}>
                  {profile.summary}
                </p>

                <div style={{ marginTop: 18 }}>
                  <MailToButton />
                </div>
              </div>

              {/* TRUST PANEL */}
              <div className="card" style={{ padding: 18 }}>
                <div className="nda-badge-container">
                  <h2 style={{ margin: 0, fontSize: 18 }}>Overview of my Last Automation</h2>
                  <span className="badge" >NDA-Safe</span>
                </div>
                
                <p style={{ margin: "10px 0 0", color: "var(--muted)" }}>
                  A backlog of 300 websites, each one requiring 30 Minutes of Manual & repetitive set up workflows.

                </p>

                <section id="main-section-mini-cards" className="grid cols-2" style={{ marginTop: 14 }}>
                  {stats.map((s) => (
                    <div key={s.label} className="card">
                      <div className="flex-row">
                          <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                          <div style={{ color: "var(--muted)" }}>{s.label}</div>
                      </div>  
                          {s.note ? <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>{s.note}</div> : null}     
                    </div>
                  ))}
                </section>

                
              </div>
            </div>

            {/* SKILLS */}
            <section id="skills-section" className="card" style={{ padding: 18, marginTop: 18 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Tooling & strengths</h2>
              <div className="grid cols-3" style={{ marginTop: 12 }}>
                {skills.map((g) => (
                  <div key={g.group} className="card">
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>{g.group}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {g.items.map((x) => (
                        <span key={x} className="badge">{x}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </section>
        {/* PROJECTS */}
        <Section
          id="projects"
          title="Automation projects"
          lead="Five focused projects that show how I design frameworks, reduce flakiness, and ship reliable quality signals."
        >
          <div className="grid cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.title} p={p} />
            ))}
          </div>
        </Section>
        {/* DIPLOMAS */}
        <Section
          id="diplomas"
          title="Diplomas & certifications"
          lead="Structured learning across QA, automation, engineering, and leadership. Proof links can point to credential pages."
        >
          <DiplomaGrid diplomas={diplomas} />
        </Section>
        {/* EXPERIENCE */}
        <Section
          id="experience"
          title="Experience"
          lead="Recent roles focused on delivery efficiency, automation-first QA, and reliable execution at scale."
        >
          <div className="grid cols-2">
            {experiences.map((e) => (
              <article key={`${e.role}-${e.company}`} className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{e.role}</h3>
                    <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>{e.company}</p>
                  </div>
                  <span className="badge">{e.period}</span>
                </div>

                <ul style={{ margin: "12px 0 0", paddingLeft: 18 }}>
                  {e.bullets.map((b) => (
                    <li key={b} style={{ marginBottom: 8, color: "var(--text)" }}>
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="card" style={{ padding: 18, marginTop: 16 }}>
            <p style={{ margin: 0, color: "var(--muted)" }}>{otherExperience}</p>
          </div>
        </Section>


        {/* CONTACT */}
        <Section
          id="contact"
          title="Let’s talk"
          lead="If you're hiring for QA Automation, I’m available for interviews and technical assessments."
        >
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{profile.name}</div>
                <div style={{ color: "var(--muted)", marginTop: 6 }}>{profile.role}</div>
              </div>
              <MailToButton />
            </div>
          </div>
        </Section>

        <footer style={{ padding: "28px 0 40px", borderTop: "1px solid var(--soft)" }}>
          <div className="container" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ color: "var(--muted)" }}>
              © {new Date().getFullYear()} {profile.name}
            </span>
            <span style={{ color: "var(--muted)" }}>
              Built with React + Vite
            </span>
          </div>
        </footer>
      </main>
    </section>
  );
}
