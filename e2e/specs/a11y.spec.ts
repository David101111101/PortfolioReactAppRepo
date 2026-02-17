import { test, expect } from "../fixtures/test";
import AxeBuilder from "@axe-core/playwright";

test("no critical accessibility violations on landing page", async ({ page, home }, testInfo) => {
  await home.goto();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze(); // axe-core + Playwright pattern

  await testInfo.attach("axe-results", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });

  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical, `Critical a11y issues:\n${critical.map((v) => v.id).join(", ")}`).toEqual([]);
});
