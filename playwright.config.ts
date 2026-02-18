import { defineConfig, devices } from "@playwright/test";

function normalizeBasePath(p: string) {
  // Ensures: "/" or "/PortfolioReactAppRepo/"
  const trimmed = (p || "/").trim();
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

// Origin only (no repo path here)
const ORIGIN = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4173";

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
    command: "npm run preview -- --host localhost --port 4173 --strictPort",
    url: ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
