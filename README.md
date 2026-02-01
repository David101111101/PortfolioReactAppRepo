# David Abril — QA Automation Engineer Portfolio

Modern portfolio built with React + Vite + TypeScript to showcase QA automation projects, impact metrics, and certifications.

## About me

**David Abril** — **QA Automation Engineer** (English C2)  
Automation-focused QA engineer with backend dev experience and team leadership. I’m driven by challenges and bigger goals, and I’m pursuing an automation-first role while deepening engineering skills.

### Quick highlights

- ✅ Automated **10** website setup workflows with a Playwright framework (~**1038 LOC**)  
- ✅ Saved **175 hours** of manual work and reduced repetitive workload  
- ✅ Automated **113** manual steps across modules per site  
- ✅ Scaled execution to **~140,000 DOM interactions** and forecast **~46 days saved** across a 300-site backlog  
- ✅ CI/CD-ready delivery with Azure DevOps

---

## What’s inside

### Sections

- Hero + trust signals (impact metrics, principles)
- Skills (automation, testing strategy, CI/CD, languages)
- Projects (5+ automation projects)
- Experience (work history + measurable outcomes)
- Diplomas & certifications (filterable grid)

---

## Featured automation projects

- **Playwright Site-Setup Framework (Owner/Dev/Tester)**  
  Automated 10 core setup workflows; reusable utilities, stable architecture, debug-friendly structure.

- **Cypress Framework (Dev/Tester)**  
  Advanced E2E + backend techniques: retries, plugins, custom commands, parallel runs, video reporting, Docker/Node usage.

- **Puppeteer Framework (Dev/Tester)**  
  Geolocation, PDF generation, accessibility checks, device emulation, performance checks, parallel browser execution, BDD (Gherkin).

- **Playwright E2E Store Flow (Dev/Tester)**  
  Full user journey automation: search → cart → checkout/payment with assertions, tracing, screenshots, multi-browser execution.

- **Cypress Backend Testing Framework (Dev/Tester)**  
  API validation with REST/JSON, GraphQL (PokeAPI practice), SQL/MySQL + MongoDB CRUD checks, headers/content-type validation.

- **Azure DevOps: CI/CD**  
  Automated build and deployment pipeline for this portfolio, version control workflows, and publishing directly to Azure.

> Update project titles/descriptions/links in: `src/data/portfolio.ts`

---

## Core skills

**Test Automation:** Playwright, Cypress, Puppeteer  
**Languages:** Java, JavaScript, TypeScript, SQL/MySQL, C#, HTML, CSS, JSON  
**Testing:** UI automation, E2E frameworks, API testing, backend testing, test strategy (exploratory/integration/regression/smoke/functional/usability/compatibility/security/accessibility)  
**CI/CD & Tooling:** Git, Azure DevOps, REST/JSON, Postman, Docker, Allure reporting, data analysis & predictive forecasting  
**Delivery:** Agile methodologies, documentation, cross-team collaboration

---

## Local development

### Requirements
- Node.js (LTS recommended)
- npm

### Install & run
```
npm install
npm run dev
```

### Build for production
```
npm run build
npm run preview
```

## Scripts

- \`npm run dev\` — local dev server
- \`npm run build\` — production build
- \`npm run preview\` — preview the production build locally

## Repo structure (high level)

```
  src/
  components/      # UI building blocks (Header, cards, grids, sections)
  data/            # Portfolio content (projects, experience, diplomas)
  styles/          # Theme & global styles
  public/          # Static assets (resume, diploma images, screenshots)
```

## Deployment

This repo is designed to be CI/CD friendly. Recommended pipeline flow:
1. Install dependencies (\`npm ci\`)
2. Build (\`npm run build\`)
3. Publish \`dist/\` as the deployment artifact
4. Deploy to Azure


## Contact

- Email davidstevenabril@gmail.com