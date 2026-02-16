import { test as base, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";

const ALLOWLIST = [
  /ResizeObserver loop limit exceeded/i,
  /The message port closed before a response was received/i,
];

type Fixtures = {
  home: HomePage;
  consoleErrors: string[];
};

export const test = base.extend<Fixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];

    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
    });

    await use(errors);
  },

  home: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});

test.afterEach(async ({ consoleErrors }, testInfo) => {
  const relevant = consoleErrors.filter((e) => !ALLOWLIST.some((re) => re.test(e)));

  if (relevant.length) {
    await testInfo.attach("console-errors", {
      body: relevant.join("\n"),
      contentType: "text/plain",
    });

    // Only fail-on-console-errors if the test otherwise passed
    if (testInfo.status === "passed") {
      expect(relevant, "Console errors detected").toEqual([]);
    }
  }
});

export { expect };
