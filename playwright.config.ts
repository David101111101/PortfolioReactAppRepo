import { defineConfig, devices } from "@playwright/test";

// Origin only
const ORIGIN = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173";
// in CI runs tests headless to avoid flakiness
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ["line"],
    ['dot'],
    ["html", { open: "never" }],
    ["json", { outputFile: "playwright-report/report.json" }],
    ['dot'],
    ["junit", { outputFile: "playwright-report/junit.xml" }],
  ],

  use: {
    // Keep baseURL as ORIGIN only; base-path routing is handled by your page objects (goto()).
    baseURL: ORIGIN,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 40_000,
    viewport: { width: 800, height: 600 },
    contextOptions: {
      reducedMotion: 'reduce'
    }
  },

  webServer: {
  command:
    "npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
  url: "http://127.0.0.1:4173",
  reuseExistingServer: !process.env.CI,
  timeout: 200_000,
  },

  projects: [
    { name: "chromium", use: { browserName: "chromium", headless: isCI }},
    { name: "firefox",  use: { browserName: "firefox",  headless: isCI, actionTimeout: 25000, navigationTimeout: 60000  }},
    { name: "webkit",   use: { browserName: "webkit",   headless: isCI}
    },
  ]
  
});
