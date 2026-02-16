import { defineConfig, devices } from "@playwright/test";

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
  ], 

  use: { 
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173/", // Base URL for actions like `page.goto("/")` in ubuntu's VM and CI environments
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  // Start the dev server before running the tests and shut it down afterward, 
  webServer: { 
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://127.0.0.1:4173/", // Wait for the server to be ready before running tests
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
