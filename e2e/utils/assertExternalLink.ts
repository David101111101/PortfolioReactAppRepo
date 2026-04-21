import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

type ExternalLinkOptions = {
  expectedHostname: string;
  expectedPathname?: string;
};

export async function assertExternalLinkOpensCorrectly(
  _page: Page,
  link: Locator,
  { expectedHostname, expectedPathname }: ExternalLinkOptions
) {
  // Ensure link opens in new tab (UX contract)
  await expect(link).toHaveAttribute("target", "_blank");
  // Ensure security best practice is enforced
  await expect(link).toHaveAttribute("rel", /noreferrer/);

  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();

  const url = new URL(href!);
  // Validate hostname
  expect(url.hostname).toContain(expectedHostname);

  // Validate pathname if provided
  if (expectedPathname) {
    expect(url.pathname).toBe(expectedPathname);
  }
}
