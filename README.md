# David Abril — QA Automation Engineer / SDET Portfolio

**This repo itself demonstrates production-grade practices:** integrated Playwright E2E tests, accessibility checks, performance audits, automated PR quality gates visual reporting with Junit and automatig Summary comment generated & posted.
https://david101111101.github.io/PortfolioReactAppRepo

## About me

**David Abril** — **QA Automation Engineer** (English C2 Certified)  
Automation-focused QA engineer with backend development and team leadership experience. Driven by challenges and continuous learning, I pursue automation-first roles while deepening engineering skills.

### Impact highlights

- ✅ Automated **11** core setup workflows, saving **150+ hours** of manual work
- ✅ Reduced **113** manual steps per site through framework design
- ✅ Executed **~140,000 DOM interactions** with stable, maintainable test architecture
- ✅ Built **Playwright + GitHub Actions PR gates** to keep main deployable
- ✅ Cross-browser execution, accessibility compliance, and performance budgets in every PR

---

### Quality assurance built-in

- **Automated E2E tests** — Smoke, navigation, accessibility checks on every PR
- **Cross-browser validation** — Tests run on Chromium, Firefox, WebKit in parallel
- **Accessibility audits** — axe-core integration ensures WCAG compliance
- **Performance budgets** — Lighthouse CI prevents regressions
- **Instant debugging** — Traces, screenshots, videos retained on failure

---

## 🚀 PR Quality Gates: Playwright E2E + GitHub Actions

This portfolio itself demonstrates production-grade automation practices. Every pull request is validated through an integrated Playwright E2E framework before merging to `main`.

### What's automated

| Feature | Benefit |
|---------|---------|
| **Fixtures + Page Object Model (POM)** | Maintainable, scalable test architecture that reduces friction as tests grow |
| **Cross-browser execution** | Parallel runs across Chromium, Firefox, and WebKit—catch rendering bugs across engines |
| **Accessibility checks** | axe-core integration validates WCAG compliance in every PR |
| **Performance budgets** | Lighthouse CI enforces performance thresholds—no regressions slip through |
| **Debug artifacts** | Traces, screenshots, and videos auto-retained on failure for instant root-cause analysis |
| **JUnit in Checks UI** | Test results appear in GitHub's native Checks panel—no downloads needed |
| **Automated PR comments** | github-actions[bot] posts a summary per run so reviewers get instant signal |

### Why it matters

✅ **PR gates reduce regressions** — main stays deployable  
✅ **Debug artifacts make failures actionable** — not just "red/green"  
✅ **Fast, readable CI feedback** — developers iterate with confidence  

---

## Local development

### Requirements

- **Node.js** (LTS recommended)
- **npm** or **yarn**

### Install & run

```bash
npm install
npm run dev
```

Opens local dev server at `http://localhost:5173`

### Running E2E tests

```bash
npm run test:e2e        # Run all tests (headless, default: Chromium)
npm run test:e2e:ui     # Interactive UI mode (great for debugging)
npm run test:e2e:report # View test results & traces
```

Tests validate:
- ✅ Smoke (page loads, critical paths work)
- ✅ Navigation (header, routing, external links)
- ✅ Accessibility (axe-core: WCAG compliance)
- ✅ Resume download functionality

### Build for production

```bash
npm run build
npm run preview       # Preview the production build locally
```

## Scripts reference

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local dev server (hot reload) |
| `npm run build` | Production build + type checking |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint checks |
| `npm run test:e2e` | Run E2E tests (headless) |
| `npm run test:e2e:ui` | Interactive test UI mode |
| `npm run test:e2e:report` | View detailed test report & traces |

## Repo structure

```
src/
├── components/         # UI: Header, ProjectCard, DiplomaGrid, Section, etc.
├── data/               # Portfolio meta: projects, skills, experiences, diplomas
├── styles/             # Global theme & CSS
├── App.tsx             # Root component
└── main.tsx            # Entry point

e2e/
├── fixtures/           # Playwright test fixtures & configuration
├── pages/              # Page Object Models (HomePage, etc.)
└── specs/              # E2E test suites (smoke, navigation, accessibility, resume)

.github/workflows/
├── pr-quality-gates.yml   # PR validation: E2E + Lighthouse
└── deploy.yml             # Release: build & deploy to Azure

public/
├── diplomas/           # Certification images
└── other assets
```

## Deployment

This repo is designed to be CI/CD friendly with automated PR quality gates and release pipelines.

### PR Quality Gates (Branch Protection)

Every PR to `main` is automatically validated:

1. **E2E Tests** — Cross-browser (Chromium, Firefox, WebKit) smoke, navigation, and accessibility checks
2. **Lighthouse Audits** — Performance budget enforcement (ensuring no regressions)
3. **Test Results** — JUnit reports visible in GitHub Checks UI
4. **PR Summary** — Automated comment with test results posted by github-actions[bot]

→ *Only PRs that pass all gates can be merged to main*

Workflow: [.github/workflows/pr-quality-gates.yml](.github/workflows/pr-quality-gates.yml)

### Release & Deployment

Once merged to `main`:

1. **Build** — Install dependencies (`npm ci`), type-check, and compile with Vite
2. **Artifact** — Compress `dist/` folder into a deployable archive
3. **Publish** — Deploy directly to Azure for Continuous Delivery

Workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

### Local validation before pushing

```bash
npm run build          # Catch build errors early
npm run test:e2e       # Run full test suite
npm run lint           # Check code quality
```

This mirrors what the CI pipeline will check—catch issues before opening a PR.


## Contact

- Email davidstevenabril@gmail.com