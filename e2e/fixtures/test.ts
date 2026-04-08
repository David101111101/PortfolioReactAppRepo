/**
 * Playwright test fixtures for the portfolio E2E suite
 *
 * Extends the base Playwright test with:
 * - HomePage POM instance for easy reuse across tests
 * - Console error collection and reporting with ignoreability
 * - Automatic error attachment to test report on failure
 * - Structured metric collection for Supabase ingestion
 */

import { test as base, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";


/**
 * Allowlist of console errors that are safe to ignore.
 * These errors are known to be benign and not indicative of actual issues.
 */
const ALLOWLIST = [
  /ResizeObserver loop limit exceeded/i,
  /The message port closed before a response was received/i,
];

/**
 * Custom fixture types that extend base Playwright fixtures
 */
type Fixtures = {
  /** Instance of HomePage POM for page interactions */
  home: HomePage;
  /** Array of console errors/warnings captured during test execution */
  consoleErrors: string[];
};

// ---------------------------------------------------------------------------
// Stable test_id map — IDs must not change unless the tested behavior changes.
// Fallback to slug with warning for unmapped tests.
// ---------------------------------------------------------------------------
const TEST_ID_MAP: Record<string, string> = {
  // smoke.spec.ts (5 tests)
  "landing page renders hero content":      "e2e_smoke_hero_render",
  "theme nav bar btn toggle works":         "e2e_smoke_theme_toggle",
  "chat bubble renders":                    "e2e_smoke_chat_bubble",
  "chat opens and greeting appears":        "e2e_smoke_chat_greeting",
  "chatbot responds to user message":       "e2e_smoke_chat_response",

  // navigation.spec.ts (11 tests)
  "Copy Email Header Button works":              "e2e_nav_copy_email_header",
  "Copy Email Footer Button works":              "e2e_nav_copy_email_footer",
  'nav "Projects" navigates to "#projects"':     "e2e_nav_section_projects",
  'nav "Diplomas" navigates to "#diplomas"':     "e2e_nav_section_diplomas",
  'nav "Experience" navigates to "#experience"': "e2e_nav_section_experience",
  'nav "Contact" navigates to "#contact"':       "e2e_nav_section_contact",
  "Resume PDF is accessible":                    "e2e_nav_resume_pdf",
  "Email Button header work":                    "e2e_nav_email_header",
  "Home page external buttons work":             "e2e_nav_external_links",
  "Footer page contact buttons work":            "e2e_nav_footer_contact",
  "chatbot opens and responds to mocked user message": "e2e_nav_chat_response",

  // a11y.spec.ts (1 test)
  "no critical accessibility violations on landing page": "e2e_a11y_wcag_violations",
};

function resolveTestId(title: string, specFile: string): string {
  if (TEST_ID_MAP[title]) return TEST_ID_MAP[title];
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  console.warn(`[metrics] Unmapped test: "${title}" → slug fallback: e2e_${specFile}_${slug}`);
  return `e2e_${specFile}_${slug}`;
}

// ---------------------------------------------------------------------------
// Per-worker metric state — module-level so afterAll can flush it
// ---------------------------------------------------------------------------
interface E2ETestMetric {
  test_id: string;
  test_name: string;
  suite_name: string;
  status: string;
  duration_ms: number;
  retry_count: number;
  is_flaky: boolean;
  failure_type: string | null;
  load_ms?: number;
  interaction_ms?: number;
}

const E2E_RUN_ID = process.env.RUN_ID ?? randomUUID();
const e2eMetrics: E2ETestMetric[] = [];

/**
 * Extend base Playwright test with custom fixtures
 */

export const test = base.extend<Fixtures>({
  /**
   * Fixture: consoleErrors
   * Captures all console errors and page errors that occur during test execution
   * Filters out known benign errors using the ALLOWLIST
   */
  consoleErrors: async ({ page }, provideFixture) => {
    const errors: string[] = [];

    // Listen for uncaught JavaScript errors on the page
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

    // Listen for console.error() messages
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
    });

    // Provide errors array to test, then clean up listeners
    await provideFixture(errors);
  },

  /**
   * Fixture: home
   * Provides a HomePage POM instance for test to use
   * Attached to page context, reusable across multiple test steps
   */
  home: async ({ page }, provideFixture) => {
    await provideFixture(new HomePage(page));
  },
});

/**
 * afterEach hook: Console error validation + metric collection
 * Runs after each test to:
 * - Check for unexpected console errors (existing logic)
 * - Collect structured metrics for Supabase ingestion
 */
test.afterEach(async ({ consoleErrors }, testInfo) => {
  // --- Existing: console error validation ---
  const relevant = consoleErrors.filter((e) => !ALLOWLIST.some((re) => re.test(e)));

  if (relevant.length) {
    // Attach errors to test report for easy debugging
    await testInfo.attach("console-errors", {
      body: relevant.join("\n"),
      contentType: "text/plain",
    });

    // Only fail-on-console-errors if the test otherwise passed
    // (don't mask actual test failures with console error failures)
    if (testInfo.status === "passed") {
      expect(relevant, "Console errors detected").toEqual([]);
    }
  }

  // --- New: structured metric collection ---
  const specFile = path.basename(testInfo.file, ".spec.ts");

  // Extract optional timing metrics attached by individual tests
  const metricsAttachment = testInfo.attachments.find(a => a.name === "interaction-metrics");
  let custom: Partial<E2ETestMetric> = {};
  if (metricsAttachment?.body) {
    try {
      custom = JSON.parse(metricsAttachment.body.toString());
    } catch { /* ignore malformed attachment */ }
  }

  e2eMetrics.push({
    test_id: resolveTestId(testInfo.title, specFile),
    test_name: testInfo.title,
    suite_name: `e2e_${specFile}`,
    status: testInfo.status ?? "unknown",
    duration_ms: testInfo.duration,
    retry_count: testInfo.retry,
    is_flaky: testInfo.retry > 0 && testInfo.status === "passed",
    failure_type: testInfo.status !== "passed" ? "ui_assertion_failure" : null,
    ...custom,
  });
});

/**
 * afterAll hook: Write metric artifact for this spec file's worker.
 * Each worker (one per spec file with fullyParallel: true) writes its own
 * artifact to playwright-artifacts/. The ingest-e2e-metrics.mjs script
 * reads all artifact files after all workers complete.
 */
test.afterAll(async () => {
  if (!e2eMetrics.length) return;

  const suiteName = e2eMetrics[0]?.suite_name ?? "unknown";
  const dir = path.join(process.cwd(), "playwright-artifacts");
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${suiteName}-${E2E_RUN_ID}.json`);
  fs.writeFileSync(filePath, JSON.stringify({
    run_id: E2E_RUN_ID,
    suite: "e2e",
    suite_name: suiteName,
    metrics: e2eMetrics,
  }, null, 2));

  console.log("📦 E2E metrics artifact saved:", filePath);
});

export { expect };
