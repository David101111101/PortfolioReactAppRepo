/// <reference types="node" />
import { defineConfig} from "@playwright/test";

// Origin only
const ORIGIN = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173";
const isHeaded =
  process.env.PLAYWRIGHT_HEADED === "1" ||
  process.env.PLAYWRIGHT_HEADED === "true";
const headless = !isHeaded;

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
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
    baseURL: ORIGIN,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 40_000,
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
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        headless,
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
    { name: "firefox",  use: { browserName: "firefox",  headless, actionTimeout: 25000, navigationTimeout: 60000  }},
    { name: "webkit",   use: { browserName: "webkit",   headless }
    },
  ]
  
});
