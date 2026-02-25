import { test, expect } from "../fixtures/test";

test("landing page renders hero content", async ({ home }) => {
  await home.goto();
  await expect(home.heading(/automation engineered for reliability/i)).toBeVisible();
});

test.skip("theme nav bar btn toggle works", async ({ home }) => {
  await home.goto();
  const initialTheme = await home.getTheme();
  await home.toggleTheme();
  const themeAfterFirstClick = await home.getTheme();
  expect(themeAfterFirstClick).not.toBe(initialTheme);
  await home.toggleTheme();
  const themeAfterSecondClick = await home.getTheme();
  expect(themeAfterSecondClick).toBe(initialTheme);
});
