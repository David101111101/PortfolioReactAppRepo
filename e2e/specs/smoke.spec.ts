import { test, expect } from "../fixtures/test";

test("landing page renders hero content", async ({ home }) => {
  await home.goto();
  await expect(home.heading(/automation engineered for reliability/i)).toBeVisible();
});
