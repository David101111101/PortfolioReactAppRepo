import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

type ExternalLinkOptions = {
  expectedHostname: string;
  expectedPathname?: string;
};

export async function assertExternalLinkOpensCorrectly(
  page: Page,
  link: Locator,
  { expectedHostname, expectedPathname }: ExternalLinkOptions
) {
  // Ensure link opens in new tab (UX contract)
  await expect(link).toHaveAttribute("target", "_blank");
  // Ensure security best practice is enforced
  await expect(link).toHaveAttribute("rel", /noreferrer/);
  const href = await link.getAttribute("href");

  expect(href).toBeTruthy();

  const popupPromise = page.waitForEvent("popup", { timeout: 5000 }).catch(() => null);

  await link.click();
  const popup = await popupPromise;

  const url = popup
    ? (await popup.waitForLoadState("domcontentloaded", { timeout: 10000 }), new URL(popup.url()))
    : new URL(href!, page.url());

  // Validate hostname
  expect(url.hostname).toContain(expectedHostname);

  // Validate pathname if provided
  if (expectedPathname) {
    expect(url.pathname).toBe(expectedPathname);
  }

  await popup?.close();
}