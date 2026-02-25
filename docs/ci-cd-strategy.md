# CI/CD Strategy -- Portfolio & RAG Chatbot

## 1. Purpose

This document defines the Continuous Integration and Continuous
Deployment (CI/CD) strategy for the Portfolio project and its RAG/LLM
chatbot integration.

The pipeline is designed to:

-   Prevent regressions before reaching production\
-   Enforce accessibility and performance standards\
-   Maintain strict type and lint discipline\
-   Validate deployment integrity\
-   Serve as an automated PR quality gate\
-   Demonstrate SDET-level automation maturity

------------------------------------------------------------------------

## 2. CI/CD Philosophy

The pipeline follows a **Shift-Left Quality Engineering model**:

-   All quality gates execute on Pull Requests\
-   Failures block merges\
-   Production deployment occurs only after validation\
-   No manual QA sign-off required for merge\
-   Main branch remains continuously deployable

This ensures deterministic quality enforcement rather than manual
validation.

------------------------------------------------------------------------

## 3. Branch Strategy

  Branch             Purpose
  ------------------ -------------------------------
  `main`             Production-ready code
  Feature branches   Development & experimentation

**Rules:**

-   All changes must go through Pull Requests\
-   Direct pushes to `main` are restricted\
-   PR must pass all CI checks before merge\
-   Branch protection enforces required status checks

------------------------------------------------------------------------

## 4. CI Pipeline Overview

**Triggers:**

-   On Pull Request\
-   On push to `main`

**Execution Flow:**

1.  Install Dependencies (`npm ci`)\
2.  Type Check (TypeScript strict mode)\
3.  Lint (ESLint enforcement)\
4.  Playwright E2E Tests (Cross-browser)\
5.  Accessibility Audit (axe-core)\
6.  Lighthouse Performance Audit\
7.  Build Verification (Vite production build)

If any stage fails → PR is blocked.

------------------------------------------------------------------------

## 5. Quality Gates

### 5.1 Type Safety

-   Strict TypeScript compilation\
-   No implicit `any`\
-   Build fails on type errors

Purpose: Prevent runtime instability and enforce maintainable contracts.

------------------------------------------------------------------------

### 5.2 Linting

-   ESLint rule enforcement\
-   Code style and best-practice validation\
-   Lint failure blocks PR

------------------------------------------------------------------------

### 5.3 End-to-End Testing (Playwright)

Architecture:

-   Fixtures
-   Page Object Model (POM)
-   Parallel cross-browser execution (Chromium, Firefox, WebKit)

Validations:

-   Smoke tests (core load paths)
-   Navigation flows
-   Resume download
-   Critical UI rendering

Artifacts retained on failure:

-   Traces
-   Screenshots
-   Videos
-   JUnit report in GitHub Checks UI
-   Automated PR summary comment

Purpose:

-   Maintain deployable `main`
-   Provide actionable debugging context
-   Prevent regressions before merge

------------------------------------------------------------------------

### 5.4 Accessibility Testing

Tool: `axe-core` integrated within Playwright tests

Policy:

-   Zero critical accessibility violations allowed\
-   Applied to landing page + chatbot UI\
-   PR fails on violation detection

Ensures WCAG compliance and inclusive UX enforcement.

------------------------------------------------------------------------

### 5.5 Performance Budgets

Tool: Lighthouse CI

Measured:

-   Performance score
-   Accessibility score
-   Best Practices score
-   SEO score

Thresholds enforced.\
If score drops below baseline → PR fails.

Prevents silent performance regressions.

------------------------------------------------------------------------

### 5.6 Smoke Testing (Deployment Validation)

Smoke tests validate:

-   Application loads
-   Core UI renders
-   Chatbot endpoint responds
-   Deployment URL reachable

Executed:

-   On PR
-   After production deployment

Purpose: Ensure minimal viable system integrity.

------------------------------------------------------------------------

## 6. Deployment Strategy

Workflow: `.github/workflows/deploy.yml`

On merge to `main`:

1.  Install dependencies\
2.  Type-check and build\
3.  Package production artifact\
4.  Deploy to hosting provider\
5.  Execute post-deploy smoke validation

If deployment smoke fails:

-   Deployment considered unstable\
-   Immediate investigation required

No manual override policy.

------------------------------------------------------------------------

## 7. RAG / Chatbot CI Considerations

Current validation focuses primarily on frontend behavior and endpoint
availability.

Planned backend CI enhancements:

-   Worker unit tests\
-   RAG similarity logic tests\
-   Prompt injection tests\
-   Fallback behavior validation\
-   Rate limiting verification\
-   Coverage enforcement\
-   Logging verification

Future integration:

-   Miniflare integration tests\
-   Deterministic RAG evaluation harness

Goal: Extend CI rigor to AI behavior validation.

------------------------------------------------------------------------

## 8. Secrets Management

Secrets used:

-   OpenAI API key\
-   Supabase credentials\
-   Cloudflare tokens

Policies:

-   Stored in GitHub Secrets\
-   Never committed to repository\
-   Injected at runtime\
-   Scoped to required workflows

------------------------------------------------------------------------

## 9. Observability & Logging (Planned)

Future CI validation will ensure:

-   Logging endpoints function correctly\
-   Error paths are recorded\
-   Rate limiting events logged\
-   Failure cases produce traceable signals

This strengthens backend reliability enforcement.

------------------------------------------------------------------------

## 10. Coverage Strategy (Planned)

Next phase includes:

-   Unit test coverage report generation\
-   Branch coverage enforcement\
-   Coverage threshold gate (≥ 80%)\
-   PR fails if coverage decreases

Purpose:

-   Prevent silent logic regressions\
-   Demonstrate full-stack SDET maturity

------------------------------------------------------------------------

## 11. Security Automation (Planned)

Planned additions:

-   Injection attempt tests\
-   Malformed payload tests\
-   Oversized payload rejection tests\
-   `npm audit` dependency scan\
-   Vulnerability scanning enforcement

------------------------------------------------------------------------

## 12. Failure Handling Policy

If any CI job fails:

-   PR is blocked\
-   Fix required before merge

If deployment smoke fails:

-   Production flagged unstable\
-   Hotfix or rollback required

No bypass mechanism permitted.

------------------------------------------------------------------------

## 13. Benefits of Current Architecture

-   Automated regression prevention\
-   Deterministic performance enforcement\
-   Accessibility built into workflow\
-   Zero reliance on manual QA\
-   Debug artifacts retained automatically\
-   Infrastructure-light deployment model\
-   Production-grade PR gating strategy

------------------------------------------------------------------------

## 14. Current Maturity vs Target State

**Current State:**

-   Frontend E2E gates enforced\
-   Performance budgets enforced\
-   Accessibility validated\
-   Deployment smoke enforced\
-   PR blocking enabled

**Target State:**

-   Full-stack automated validation\
-   Deterministic RAG logic testing\
-   Security regression suite\
-   Coverage-based enforcement\
-   AI behavior evaluation framework

------------------------------------------------------------------------

## 15. Summary

This CI/CD strategy ensures:

-   Every change is validated before merge\
-   Regressions are blocked automatically\
-   Accessibility and performance are enforced\
-   Deployment integrity is verified\
-   The portfolio demonstrates production-grade QA automation maturity

The next evolution extends the same rigor to backend RAG logic and AI
behavior validation.
