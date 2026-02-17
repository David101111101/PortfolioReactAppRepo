import { test, expect } from "../fixtures/test";

test("Resume link serves a PDF", async ({ page, home }) => {
  await home.goto();

  const href = await home.resumeLink().getAttribute("href");
  expect(href, "Resume link should have href").toBeTruthy();

  const url = new URL(href!, page.url()).toString();
  const resp = await page.request.get(url);

  expect(resp.ok(), `Resume request failed: ${url}`).toBeTruthy();
  expect(resp.headers()["content-type"] || "").toMatch(/pdf/i);
});
