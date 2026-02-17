/**
 * Playwright test fixtures for the portfolio E2E suite
 *
 * Extends the base Playwright test with:
 * - HomePage POM instance for easy reuse across tests
 * - Console error collection and reporting with ignoreability
 * - Automatic error attachment to test report on failure
 */

import { test as base, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";

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

/**
 * Extend base Playwright test with custom fixtures
 */
export const test = base.extend<Fixtures>({
  /**
   * Fixture: consoleErrors
   * Captures all console errors and page errors that occur during test execution
   * Filters out known benign errors using the ALLOWLIST
   */
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];

    // Listen for uncaught JavaScript errors on the page
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

    // Listen for console.error() messages
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
    });

    // Provide errors array to test, then clean up listeners
    await use(errors);
  },

  /**
   * Fixture: home
   * Provides a HomePage POM instance for test to use
   * Attached to page context, reusable across multiple test steps
   */
  home: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});

/**
 * afterEach hook: Console error validation
 * Runs after each test to check for unexpected console errors
 * - Filters errors using ALLOWLIST
 * - Attaches errors to test report for debugging
 * - Fails test if console errors were detected (only if test otherwise passed)
 */
test.afterEach(async ({ consoleErrors }, testInfo) => {
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
});

export { expect };
