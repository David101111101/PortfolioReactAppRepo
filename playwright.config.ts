import { defineConfig, devices } from "@playwright/test";

function normalizeBasePath(p: string) {
  // Ensures: "/" or "/PortfolioReactAppRepo/"
  const trimmed = (p || "/").trim();
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

// Origin only (no repo path here)
const ORIGIN = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173";

// Repo base path for GitHub Pages project sites; defaults to "/" for local + PR workflows
const APP_BASE_PATH = normalizeBasePath(process.env.APP_BASE_PATH || "/");

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ["line"],
    ["html", { open: "never" }],
    ["json", { outputFile: "playwright-report/report.json" }],
    ["junit", { outputFile: "playwright-report/junit.xml" }],
  ],

  use: {
    // Keep baseURL as ORIGIN only; base-path routing is handled by your page objects (goto()).
    baseURL: ORIGIN,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  webServer: {
    // Note: preview expects dist/ to exist, so your workflow must run `npm run build` before tests.
    command: "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",

    // IMPORTANT: wait for the correct base path to be reachable ("/" locally, "/PortfolioReactAppRepo/" in deploy)
    url: new URL(APP_BASE_PATH, ORIGIN).toString(),

    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
